import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripe, statusFrom } from "@/lib/stripe";
import { createLoginLink } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emails";

export const runtime = "nodejs";

async function syncSubscription(sub: Stripe.Subscription) {
  const parentId = sub.metadata?.parentId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const where = parentId ? eq(schema.parents.id, parentId) : eq(schema.parents.stripeCustomerId, customerId);
  const [before] = await db.select().from(schema.parents).where(where);
  if (!before) return;
  const status = statusFrom(sub);
  await db
    .update(schema.parents)
    .set({
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      subscriptionStatus: status,
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    })
    .where(eq(schema.parents.id, before.id));

  // First time the subscription starts: send the welcome email.
  if (before.subscriptionStatus === "none" && (status === "trialing" || status === "active")) {
    const kids = await db.query.children.findMany({ where: eq(schema.children.parentId, before.id) });
    const link = await createLoginLink(before.id);
    await sendEmail({
      to: before.email,
      ...welcomeEmail({
        childNames: kids.map((k) => k.firstName),
        deliveryTime: before.deliveryTime,
        trialEnds: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        accountLink: link,
      }),
    });
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const sub = await getStripe().subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id,
        );
        await syncSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}
