import { desc, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { GRADUATE_LEVEL, MAX_LEVEL } from "./curriculum";

/** Nights at a level before moving up: two weeks, from the scope & sequence. */
export const LEVEL_NIGHTS = 14;

export type Feedback = "too_hard" | "just_right" | "too_easy" | null;

/**
 * Should the child move up before tonight's routine? After two weeks at a
 * level, yes, unless the last three nights included a "too hard" (then they
 * stay a few more nights). Three "too easy" nights in a row move them up early.
 */
export function readyToMoveUp(nightsAtLevel: number, lastThree: Feedback[]): boolean {
  if (lastThree.length === 3 && lastThree.every((f) => f === "too_easy")) return true;
  return nightsAtLevel >= LEVEL_NIGHTS && !lastThree.includes("too_hard");
}

export function nextLevel(level: number): number {
  return Math.min(level + 1, GRADUATE_LEVEL);
}

export async function setLevel(childId: string, level: number) {
  await db
    .update(schema.children)
    .set({ level, levelStartedAt: new Date().toISOString().slice(0, 10) })
    .where(eq(schema.children.id, childId));
}

/**
 * Records "too hard / just right / too easy". Three "too hard" nights in a row
 * step the child back a level; three "too easy" nights in a row move them up
 * when the next routine is built (see readyToMoveUp).
 */
export async function recordFeedback(routineId: string, childId: string, value: "too_hard" | "just_right" | "too_easy") {
  await db.update(schema.routines).set({ feedback: value, feedbackAt: new Date() }).where(eq(schema.routines.id, routineId));
  if (value !== "too_hard") return { changed: false as const };
  const recent = await db.query.routines.findMany({
    where: eq(schema.routines.childId, childId),
    orderBy: desc(schema.routines.forDate),
    limit: 3,
  });
  const child = await db.query.children.findFirst({ where: eq(schema.children.id, childId) });
  if (!child || child.level > MAX_LEVEL) return { changed: false as const };
  if (recent.length === 3 && recent.every((r) => r.feedback === "too_hard" && r.level === child.level) && child.level > 1) {
    await setLevel(childId, child.level - 1);
    return { changed: true as const, level: child.level - 1 };
  }
  return { changed: false as const };
}
