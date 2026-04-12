import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyWebhookSignature } from "../_lib/stripe.js";
import { getSupabaseAdmin } from "../_lib/supabase-admin.js";
import { getOrCreateWallet } from "../_lib/cdp.js";
import { adminMintNFT } from "../_lib/mint.js";

// Disable body parsing - Stripe needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Classify errors as transient (worth retrying) or permanent */
function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up") ||
    msg.includes("network") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("nonce") ||
    msg.includes("replacement transaction underpriced")
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    const event = verifyWebhookSignature(rawBody, signature);
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (!orderId) {
          return res.status(200).json({ received: true, warning: "No order_id in metadata" });
        }

        // Get order
        const { data: order } = await supabase
          .from("pix_orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (!order) {
          return res.status(200).json({ received: true, warning: "Order not found" });
        }

        // Prevent double processing
        if (order.status !== "pending") {
          return res.status(200).json({ received: true, skipped: "Already processed" });
        }

        // Check if PIX expired before we process
        if (order.pix_expires_at) {
          const expiresAt = new Date(order.pix_expires_at);
          if (expiresAt < new Date()) {
            await supabase
              .from("pix_orders")
              .update({ status: "expired" })
              .eq("id", orderId)
              .eq("status", "pending");
            console.warn(`[webhook] Order ${orderId} PIX expired before processing`);
            return res.status(200).json({ received: true, warning: "PIX expired" });
          }
        }

        // Validate quantity before minting
        if (!Number.isInteger(order.quantity) || order.quantity < 1 || order.quantity > 10) {
          console.error(`[webhook] Invalid quantity ${order.quantity} for order ${orderId}`);
          await supabase
            .from("pix_orders")
            .update({ status: "failed", error_message: "Invalid quantity" })
            .eq("id", orderId);
          return res.status(200).json({ received: true });
        }

        // Mark as paid
        await supabase
          .from("pix_orders")
          .update({
            status: "paid",
            stripe_payment_intent_id: paymentIntent.id,
            paid_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Get or create CDP wallet for user
        let walletAddress: string;
        try {
          const wallet = await getOrCreateWallet(order.email);
          walletAddress = wallet.address;
        } catch (walletError) {
          const isTransient = isTransientError(walletError);
          console.error(`[webhook] Wallet creation failed (transient=${isTransient}) for order ${orderId}:`, walletError);

          await supabase
            .from("pix_orders")
            .update({
              status: "mint_failed",
              error_message: `Wallet creation failed: ${walletError instanceof Error ? walletError.message : String(walletError)}`,
            })
            .eq("id", orderId);

          // Return 500 on transient errors so Stripe retries the webhook
          if (isTransient) {
            return res.status(500).json({ error: "Transient wallet error — will retry" });
          }
          return res.status(200).json({ received: true });
        }

        // Atomically claim the order for minting
        const { data: claimed } = await supabase
          .from("pix_orders")
          .update({
            status: "minting",
            recipient_wallet_address: walletAddress,
          })
          .eq("id", orderId)
          .eq("status", "paid")
          .select("id")
          .single();

        if (!claimed) {
          // Another process already claimed it
          return res.status(200).json({ received: true, skipped: "Already minting" });
        }

        // Mint NFT
        try {
          const txHash = await adminMintNFT({
            recipientAddress: walletAddress,
            tokenId: order.token_id,
            quantity: order.quantity,
            orderId,
          });

          await supabase
            .from("pix_orders")
            .update({
              status: "minted",
              tx_hash: txHash,
              minted_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        } catch (mintError) {
          const isTransient = isTransientError(mintError);
          console.error(`[webhook] Mint failed (transient=${isTransient}) for order ${orderId}:`, mintError);

          await supabase
            .from("pix_orders")
            .update({
              status: "mint_failed",
              error_message: mintError instanceof Error ? mintError.message : String(mintError),
            })
            .eq("id", orderId);

          // Return 500 on transient errors so Stripe retries
          if (isTransient) {
            return res.status(500).json({ error: "Transient mint error — will retry" });
          }
        }

        return res.status(200).json({ received: true });
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          await supabase
            .from("pix_orders")
            .update({ status: "failed" })
            .eq("id", orderId)
            .eq("status", "pending");
        }

        return res.status(200).json({ received: true });
      }

      default:
        return res.status(200).json({ received: true });
    }
  } catch (error) {
    // Stripe signature verification failed or other error
    console.error("[webhook] Error:", error);
    return res.status(400).json({ error: "Webhook processing failed" });
  }
}
