import { desc, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { GRADUATE_LEVEL, MAX_LEVEL, stageOf } from "./curriculum";

export type Decision = "up" | "stay" | "back";

/**
 * Weekly check rule from the scope & sequence:
 *  9/10 moves up, 7–8/10 stays one more week, 6 or fewer steps back a level.
 *  Level 1 has six words: 6/6 moves up.
 *  From Level 25 the fluency rating also counts: it must be 2 or 3 to move up.
 */
export function decide(level: number, score: number, outOf: number, fluency: number | null): Decision {
  const pct = score / outOf;
  const fluent = stageOf(level) !== 3 || (fluency ?? 0) >= 2;
  if (pct >= 0.9 && fluent) return "up";
  if (pct >= 0.7) return "stay";
  return "back";
}

export function nextLevel(level: number, d: Decision): number {
  if (d === "up") return Math.min(level + 1, GRADUATE_LEVEL);
  if (d === "back") return Math.max(level - 1, 1);
  return level;
}

export async function setLevel(childId: string, level: number) {
  await db
    .update(schema.children)
    .set({ level, levelStartedAt: new Date().toISOString().slice(0, 10) })
    .where(eq(schema.children.id, childId));
}

/**
 * Records "too hard / just right / too easy". Three "too hard" nights in a row
 * step the child back a level; three "too easy" nights in a row bring the
 * weekly check forward to the next routine (handled when it is built).
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
