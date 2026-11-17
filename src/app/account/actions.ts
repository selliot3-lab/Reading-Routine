"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { currentParent, endSession } from "@/lib/auth";
import { INTERESTS } from "@/lib/content";
import { env, isStripeConfigured } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { runForChild } from "@/lib/routine";

async function requireParent() {
  const parent = await currentParent();
  if (!parent) redirect("/account/login");
  return parent;
}

export async function updateSchedule(formData: FormData) {
  const parent = await requireParent();
  const deliveryTime = String(formData.get("deliveryTime") ?? "");
  const timezone = String(formData.get("timezone") ?? "");
  const patch: Partial<typeof schema.parents.$inferInsert> = {};
  if (/^\d{2}:\d{2}$/.test(deliveryTime)) patch.deliveryTime = deliveryTime;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    patch.timezone = timezone;
  } catch {
    /* ignore unknown zones */
  }
  await db.update(schema.parents).set(patch).where(eq(schema.parents.id, parent.id));
  revalidatePath("/account");
}

export async function setPaused(formData: FormData) {
  const parent = await requireParent();
  await db
    .update(schema.parents)
    .set({ paused: formData.get("paused") === "1" })
    .where(eq(schema.parents.id, parent.id));
  revalidatePath("/account");
}

/** Lines like "Nana - grandma" become { name, relation }. */
function parsePairs(text: string, key: "relation" | "kind") {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((l) => {
      const [name, ...rest] = l.split(/\s+[-–—]\s+|,\s*/);
      return { name: name.slice(0, 40), [key]: rest.join(" ").slice(0, 40) } as never;
    });
}

export async function updateChild(formData: FormData) {
  const parent = await requireParent();
  const childId = String(formData.get("childId"));
  const known = new Set(INTERESTS.map((i) => i.id));
  await db
    .update(schema.children)
    .set({
      interests: formData.getAll("interests").map(String).filter((i) => known.has(i)),
      favouriteThings: String(formData.get("favouriteThings") ?? "").slice(0, 400) || null,
      specialPeople: parsePairs(String(formData.get("specialPeople") ?? ""), "relation"),
      pets: parsePairs(String(formData.get("pets") ?? ""), "kind"),
      inStorytime: formData.get("inStorytime") === "on",
    })
    .where(and(eq(schema.children.id, childId), eq(schema.children.parentId, parent.id)));
  revalidatePath("/account");
}

/** Builds and sends today's routine right away (e.g. if an email went missing). */
export async function sendNow(formData: FormData) {
  const parent = await requireParent();
  const child = await db.query.children.findFirst({
    where: and(eq(schema.children.id, String(formData.get("childId"))), eq(schema.children.parentId, parent.id)),
  });
  if (!child) return;
  // Sends today's routine if it hasn't gone out yet; re-sends nothing that was already delivered.
  await runForChild(child, parent);
  revalidatePath("/account");
}

export async function openBillingPortal() {
  const parent = await requireParent();
  if (!isStripeConfigured() || !parent.stripeCustomerId) redirect("/account?billing=unavailable");
  const session = await getStripe().billingPortal.sessions.create({
    customer: parent.stripeCustomerId!,
    return_url: `${env.APP_URL}/account`,
  });
  redirect(session.url);
}

export async function signOut() {
  await endSession();
  redirect("/");
}
