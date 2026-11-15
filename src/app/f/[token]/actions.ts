"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { recordFeedback } from "@/lib/progression";

export async function saveFeedback(token: string, value: "too_hard" | "just_right" | "too_easy") {
  if (!["too_hard", "just_right", "too_easy"].includes(value)) return { ok: false as const };
  const routine = await db.query.routines.findFirst({ where: eq(schema.routines.token, token) });
  if (!routine) return { ok: false as const };
  const result = await recordFeedback(routine.id, routine.childId, value);
  return { ok: true as const, ...result };
}
