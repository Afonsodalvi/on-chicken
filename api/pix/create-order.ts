import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabase-admin.js";
import { createPixPaymentIntent } from "../_lib/stripe.js";
import { MAX_ORDERS_PER_EMAIL_PER_HOUR } from "../_lib/config.js";
import crypto from "crypto";

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

function validateEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, cpf, tokenId, quantity = 1 } = req.body || {};

    // Validate input types
    if (typeof email !== "string" || !validateEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (typeof cpf !== "string" || !validateCPF(cpf)) {
      return res.status(400).json({ error: "CPF inválido" });
    }
    if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > 18) {
      return res.status(400).json({ error: "Token ID inválido (1-18)" });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: "Quantidade inválida (1-10)" });
    }

    const supabase = getSupabaseAdmin();

    // Rate limiting: max orders per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("pix_orders")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((count || 0) >= MAX_ORDERS_PER_EMAIL_PER_HOUR) {
      return res.status(429).json({ error: "Muitos pedidos. Tente novamente em 1 hora." });
    }

    // Look up NFT price (stored in USD cents)
    const { data: priceData, error: priceError } = await supabase
      .from("nft_prices")
      .select("price_usd_cents, is_active")
      .eq("token_id", tokenId)
      .single();

    if (priceError || !priceData) {
      return res.status(400).json({ error: "Preço não encontrado para este NFT" });
    }
    if (!priceData.is_active) {
      return res.status(400).json({ error: "Este NFT não está disponível para venda" });
    }

    // Fetch live USD→BRL exchange rate with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let exchangeRate: number;
    try {
      const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!rateRes.ok) {
        return res.status(503).json({ error: "Erro ao obter cotação do dólar" });
      }
      const rateData = await rateRes.json();
      exchangeRate = rateData.rates?.BRL;
      if (!exchangeRate || typeof exchangeRate !== "number") {
        return res.status(503).json({ error: "Cotação BRL indisponível" });
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return res.status(503).json({ error: "Timeout ao obter cotação do dólar" });
    }

    const totalPriceUsdCents = priceData.price_usd_cents * quantity;
    // Convert USD cents → BRL cents (e.g., 6500 USD cents * 5.50 = 35750 BRL cents = R$357.50)
    const totalPriceBrl = Math.round(totalPriceUsdCents * exchangeRate);

    // Upsert user
    const cleanedCpf = cpf.replace(/\D/g, "");
    const { data: user } = await supabase
      .from("pix_users")
      .upsert(
        { email, cpf: cleanedCpf },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (!user) {
      return res.status(500).json({ error: "Erro ao processar pedido" });
    }

    // Deterministic idempotency key (no Date.now — same inputs = same key)
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${email}:${tokenId}:${quantity}`)
      .digest("hex");

    // Check for existing pending order with same idempotency key
    const { data: existingOrder } = await supabase
      .from("pix_orders")
      .select("id, status, pix_qr_code, pix_copy_paste, pix_expires_at, price_brl, stripe_payment_intent_id")
      .eq("idempotency_key", idempotencyKey)
      .in("status", ["pending"])
      .single();

    if (existingOrder && existingOrder.pix_expires_at) {
      const expiresAt = new Date(existingOrder.pix_expires_at);
      if (expiresAt > new Date()) {
        // Return existing pending order instead of creating duplicate
        return res.status(200).json({
          orderId: existingOrder.id,
          pixQrCode: existingOrder.pix_qr_code,
          pixCopyPaste: existingOrder.pix_copy_paste,
          expiresAt: existingOrder.pix_expires_at,
          amount: existingOrder.price_brl,
        });
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("pix_orders")
      .insert({
        user_id: user.id,
        email,
        token_id: tokenId,
        quantity,
        price_usd_cents: totalPriceUsdCents,
        price_brl: totalPriceBrl,
        exchange_rate: exchangeRate,
        status: "pending",
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return res.status(500).json({ error: "Erro ao processar pedido" });
    }

    // Create Stripe PIX Payment Intent
    const paymentIntent = await createPixPaymentIntent({
      amountCentavos: totalPriceBrl,
      email,
      orderId: order.id,
      tokenId,
      quantity,
    });

    // Extract PIX data from payment intent
    const pixAction = paymentIntent.next_action?.pix_display_qr_code;

    // Update order with Stripe data
    await supabase
      .from("pix_orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        pix_qr_code: pixAction?.image_url_png || null,
        pix_copy_paste: pixAction?.data || null,
        pix_expires_at: pixAction?.expires_at
          ? new Date(pixAction.expires_at * 1000).toISOString()
          : null,
      })
      .eq("id", order.id);

    return res.status(200).json({
      orderId: order.id,
      pixQrCode: pixAction?.image_url_png || null,
      pixCopyPaste: pixAction?.data || null,
      expiresAt: pixAction?.expires_at
        ? new Date(pixAction.expires_at * 1000).toISOString()
        : null,
      amount: totalPriceBrl,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("[create-order] Unhandled error:", error);
    return res.status(500).json({ error: "Erro ao processar pedido" });
  }
}
