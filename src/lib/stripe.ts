import Stripe from "stripe";
import { env } from "./env";

let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  stripe ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripe;
}

/** $10 for the first child, $5 for each brother or sister. */
export function subscriptionItems(childCount: number): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{ price: env.STRIPE_PRICE_FIRST_CHILD, quantity: 1 }];
  if (childCount > 1) items.push({ price: env.STRIPE_PRICE_SIBLING, quantity: childCount - 1 });
  return items;
}

/** Maps a Stripe subscription status onto ours. */
export function statusFrom(sub: Stripe.Subscription): string {
  switch (sub.status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "incomplete":
      return sub.status;
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    case "paused":
      return "paused";
    default:
      return "none";
  }
}
