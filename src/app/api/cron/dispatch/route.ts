import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { dispatchDue } from "@/lib/routine";

export const runtime = "nodejs";
// Story writing takes time; allow the run up to five minutes.
export const maxDuration = 300;

/** Called every 15 minutes by Vercel Cron (see vercel.json). */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await dispatchDue();
  return NextResponse.json({ sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok) });
}
