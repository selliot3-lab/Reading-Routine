/**
 * Creates the product and two monthly prices in Stripe (CAD):
 *   first child $10, each brother or sister $8 ($2 off).
 * Prints the price IDs to put in .env as STRIPE_PRICE_FIRST_CHILD / STRIPE_PRICE_SIBLING.
 *
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
 */
import "dotenv/config";
import Stripe from "stripe";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Set STRIPE_SECRET_KEY first.");
  const stripe = new Stripe(key);
  const product = await stripe.products.create({
    name: "The Reading Routine",
    description: "A daily 15-minute reading routine: a decodable book, Spark Words and a bedtime story made for your child.",
  });
  const first = await stripe.prices.create({
    product: product.id,
    currency: "cad",
    unit_amount: 1000,
    recurring: { interval: "month" },
    nickname: "First child",
  });
  const sibling = await stripe.prices.create({
    product: product.id,
    currency: "cad",
    unit_amount: 800,
    recurring: { interval: "month" },
    nickname: "Each additional child",
  });
  console.log(`STRIPE_PRICE_FIRST_CHILD=${first.id}\nSTRIPE_PRICE_SIBLING=${sibling.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
