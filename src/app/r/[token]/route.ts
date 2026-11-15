import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { routinePdf } from "@/lib/routine";

export const runtime = "nodejs";

/** Opens a routine's PDF from the link in the email. The token is unguessable. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const routine = await db.query.routines.findFirst({ where: eq(schema.routines.token, token) });
  if (!routine || !routine.story) return new Response("This routine could not be found.", { status: 404 });
  const child = await db.query.children.findFirst({ where: eq(schema.children.id, routine.childId) });
  if (!child) return new Response("This routine could not be found.", { status: 404 });
  const pdf = await routinePdf(routine, child);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${child.firstName}-reading-routine-${routine.forDate}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
