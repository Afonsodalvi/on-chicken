import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabase-admin.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const orderId = req.query.orderId as string;

  if (!orderId || !UUID_REGEX.test(orderId)) {
    return res.status(400).json({ error: "orderId inválido" });
  }

  // Basic auth: require the email that created the order
  const email = req.query.email as string;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email é obrigatório" });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: order, error } = await supabase
      .from("pix_orders")
      .select("id, status, tx_hash, recipient_wallet_address, minted_at, token_id, quantity, pix_expires_at")
      .eq("id", orderId)
      .eq("email", email)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Check if PIX expired (still pending and past expiration)
    if (order.status === "pending" && order.pix_expires_at) {
      const expiresAt = new Date(order.pix_expires_at);
      if (expiresAt < new Date()) {
        await supabase
          .from("pix_orders")
          .update({ status: "expired" })
          .eq("id", orderId)
          .eq("status", "pending");

        return res.status(200).json({
          orderId: order.id,
          status: "expired",
          tokenId: order.token_id,
          quantity: order.quantity,
        });
      }
    }

    return res.status(200).json({
      orderId: order.id,
      status: order.status,
      txHash: order.tx_hash,
      walletAddress: order.recipient_wallet_address,
      mintedAt: order.minted_at,
      tokenId: order.token_id,
      quantity: order.quantity,
    });
  } catch (_error) {
    return res.status(500).json({ error: "Erro ao consultar pedido" });
  }
}
