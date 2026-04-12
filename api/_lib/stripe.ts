import Stripe from "stripe";
import { getConfig, PIX_EXPIRATION_MINUTES } from "./config.js";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const config = getConfig();
  stripeInstance = new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil",
  });
  return stripeInstance;
}

export async function createPixPaymentIntent(params: {
  amountCentavos: number;
  email: string;
  orderId: string;
  tokenId: number;
  quantity: number;
}) {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amountCentavos,
    currency: "brl",
    payment_method_types: ["pix"],
    metadata: {
      order_id: params.orderId,
      email: params.email,
      token_id: String(params.tokenId),
      quantity: String(params.quantity),
    },
    payment_method_options: {
      pix: {
        expires_after_seconds: PIX_EXPIRATION_MINUTES * 60,
      },
    },
  });

  return paymentIntent;
}

export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  const config = getConfig();
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, config.STRIPE_WEBHOOK_SECRET);
}
