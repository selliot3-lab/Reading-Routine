import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { FeedbackRecorder } from "./FeedbackRecorder";

const VALUES = ["too_hard", "just_right", "too_easy"] as const;

export const dynamic = "force-dynamic";

/**
 * One-tap feedback from the email or PDF. The page records the answer from the
 * browser (not on the server GET), so email link scanners that pre-open every
 * link don't record all three answers.
 */
export default async function Feedback({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { token } = await params;
  const { v } = await searchParams;
  const routine = await db.query.routines.findFirst({ where: eq(schema.routines.token, token) });
  const value = VALUES.find((x) => x === v);
  if (!routine || !value) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: "48px 16px" }}>
        <div className="card">
          <p>That link didn&apos;t work. It may be from an old email.</p>
        </div>
      </div>
    );
  }
  const child = await db.query.children.findFirst({ where: eq(schema.children.id, routine.childId) });
  return (
    <div className="stripes" style={{ padding: "48px 0", minHeight: "60vh" }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <FeedbackRecorder token={token} value={value} name={child?.firstName ?? "your child"} />
        </div>
      </div>
    </div>
  );
}
