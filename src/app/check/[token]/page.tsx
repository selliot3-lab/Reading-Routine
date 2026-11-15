import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getLevel, MAX_LEVEL, stageOf } from "@/lib/curriculum";
import { decide, nextLevel, setLevel } from "@/lib/progression";

export const dynamic = "force-dynamic";

async function submitCheck(formData: FormData) {
  "use server";
  const token = String(formData.get("token"));
  const routine = await db.query.routines.findFirst({ where: eq(schema.routines.token, token) });
  if (!routine) return;
  const child = await db.query.children.findFirst({ where: eq(schema.children.id, routine.childId) });
  if (!child) return;
  const words = getLevel(Math.min(routine.level, MAX_LEVEL)).checkWords;
  const score = words.filter((w) => formData.get(`w_${w}`) === "on").length;
  const fluencyRaw = formData.get("fluency");
  const fluency = fluencyRaw ? Number(fluencyRaw) : null;
  const decision = decide(routine.level, score, words.length, fluency);
  await db.insert(schema.checks).values({
    childId: child.id,
    routineId: routine.id,
    level: routine.level,
    score,
    outOf: words.length,
    fluency,
    decision,
  });
  // Only move the child if they're still on the level this check was for.
  if (child.level === routine.level) await setLevel(child.id, nextLevel(routine.level, decision));
  redirect(`/check/${token}?done=${decision}`);
}

export default async function Check({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  const routine = await db.query.routines.findFirst({ where: eq(schema.routines.token, token) });
  if (!routine) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: "48px 16px" }}>
        <div className="card">That link didn&apos;t work. It may be from an old email.</div>
      </div>
    );
  }
  const child = await db.query.children.findFirst({ where: eq(schema.children.id, routine.childId) });
  const name = child?.firstName ?? "your child";
  const level = getLevel(Math.min(routine.level, MAX_LEVEL));

  if (done) {
    const msg =
      done === "up"
        ? routine.level >= MAX_LEVEL
          ? `${name} has finished all 40 levels! From tomorrow, ${name} reads a chapter of their very own book to you each night.`
          : `${name} moves up to Level ${routine.level + 1}. Well done!`
        : done === "stay"
          ? `${name} stays on Level ${routine.level} for another week. Lots of practice makes it stick.`
          : `${name} goes back to Level ${Math.max(routine.level - 1, 1)} for a little while to build confidence.`;
    return (
      <div className="stripes" style={{ padding: "48px 0", minHeight: "60vh" }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <h1 className="script" style={{ fontSize: 44 }}>
              Check recorded
            </h1>
            <p>{msg}</p>
          </div>
        </div>
      </div>
    );
  }

  const stage3 = stageOf(routine.level) === 3;
  return (
    <div className="stripes" style={{ padding: "40px 0" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <form action={submitCheck} className="card">
          <input type="hidden" name="token" value={token} />
          <div className="kicker" style={{ textAlign: "center" }}>
            weekly check · level {routine.level}
          </div>
          <h1 className="script" style={{ fontSize: 40, textAlign: "center" }}>
            Which words did {name} read?
          </h1>
          <p className="muted">Tick each word {name} read correctly without help.</p>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {level.checkWords.map((w) => (
              <label key={w} style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--reader)", fontSize: 24, fontWeight: 400 }}>
                <input type="checkbox" name={`w_${w}`} style={{ width: 24, height: 24 }} />
                {w}
              </label>
            ))}
          </div>
          {stage3 && (
            <fieldset style={{ border: "none", padding: 0, marginBottom: 20 }}>
              <legend style={{ fontWeight: 700, marginBottom: 6 }}>How did the passage sound?</legend>
              {[
                [1, "Word by word"],
                [2, "In short phrases, with some stops"],
                [3, "Smooth, with expression"],
              ].map(([v, l]) => (
                <label key={v} style={{ fontWeight: 400, display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <input type="radio" name="fluency" value={v} required style={{ width: 20, height: 20 }} />
                  {l}
                </label>
              ))}
            </fieldset>
          )}
          <button className="btn" type="submit">
            Save the check
          </button>
        </form>
      </div>
    </div>
  );
}
