import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { placeFromResults } from "@/lib/curriculum";
import { INTERESTS } from "@/lib/content";
import { env, isStripeConfigured } from "@/lib/env";
import { getStripe, subscriptionItems } from "@/lib/stripe";
import { createLoginLink } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emails";

const short = (max: number) => z.string().trim().max(max);

const Body = z.object({
  email: z.email().max(200),
  firstName: short(60).optional().default(""),
  deliveryTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: short(60).refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-CA", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone"),
  consent: z.literal(true),
  children: z
    .array(
      z.object({
        firstName: short(40).min(1),
        age: z.number().int().min(3).max(12),
        pronouns: z.enum(["she", "he", "they"]),
        interests: z.array(z.string()).max(20),
        favouriteThings: short(400).nullable(),
        specialPeople: z.array(z.object({ name: short(40), relation: short(40) })).max(10),
        pets: z.array(z.object({ name: short(40), kind: short(40) })).max(10),
        placement: z.record(z.string(), z.array(z.boolean()).max(10)),
      }),
    )
    .min(1)
    .max(6),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Some details are missing or invalid. Please check the form." }, { status: 400 });
  }
  const b = parsed.data;
  const email = b.email.toLowerCase();
  const knownInterests = new Set(INTERESTS.map((i) => i.id));

  const existing = await db.query.parents.findFirst({ where: eq(schema.parents.email, email) });
  if (existing && ["trialing", "active", "past_due"].includes(existing.subscriptionStatus)) {
    return NextResponse.json(
      { error: "You already have an account with this email. Sign in to add a child or change settings." },
      { status: 409 },
    );
  }

  const [parent] = existing
    ? await db
        .update(schema.parents)
        .set({ firstName: b.firstName || null, deliveryTime: b.deliveryTime, timezone: b.timezone, consentAt: new Date() })
        .where(eq(schema.parents.id, existing.id))
        .returning()
    : await db
        .insert(schema.parents)
        .values({ email, firstName: b.firstName || null, deliveryTime: b.deliveryTime, timezone: b.timezone, consentAt: new Date() })
        .returning();

  // A restarted sign-up replaces any children from an unfinished attempt.
  await db.delete(schema.children).where(eq(schema.children.parentId, parent.id));
  const today = new Date().toISOString().slice(0, 10);
  const kids = await db
    .insert(schema.children)
    .values(
      b.children.map((c) => {
        const placement = Object.fromEntries(Object.entries(c.placement).map(([k, v]) => [Number(k), v]));
        return {
          parentId: parent.id,
          firstName: c.firstName,
          age: c.age,
          pronouns: c.pronouns,
          interests: c.interests.filter((i) => knownInterests.has(i)),
          favouriteThings: c.favouriteThings,
          specialPeople: c.specialPeople.filter((p) => p.name),
          pets: c.pets.filter((p) => p.name),
          placement: c.placement,
          level: placeFromResults(placement),
          levelStartedAt: today,
        };
      }),
    )
    .returning();

  if (!isStripeConfigured()) {
    // Development without Stripe: start the trial directly.
    const trialEndsAt = new Date(Date.now() + env.TRIAL_DAYS * 86_400_000);
    await db.update(schema.parents).set({ subscriptionStatus: "trialing", trialEndsAt }).where(eq(schema.parents.id, parent.id));
    const link = await createLoginLink(parent.id);
    await sendEmail({
      to: email,
      ...welcomeEmail({ childNames: kids.map((k) => k.firstName), deliveryTime: b.deliveryTime, trialEnds: trialEndsAt, accountLink: link }),
    });
    return NextResponse.json({ redirect: "/welcome" });
  }

  const stripe = getStripe();
  // Stripe only gets the parent's email: never the child's details.
  const customerId =
    parent.stripeCustomerId ?? (await stripe.customers.create({ email, metadata: { parentId: parent.id } })).id;
  if (!parent.stripeCustomerId) {
    await db.update(schema.parents).set({ stripeCustomerId: customerId }).where(eq(schema.parents.id, parent.id));
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: subscriptionItems(kids.length),
    subscription_data: { trial_period_days: env.TRIAL_DAYS, metadata: { parentId: parent.id } },
    metadata: { parentId: parent.id },
    success_url: `${env.APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/start`,
    allow_promotion_codes: true,
  });
  return NextResponse.json({ redirect: session.url });
}
