import { redirect } from "next/navigation";
import { consumeLoginToken, startSession } from "@/lib/auth";

async function signIn(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  const next = String(formData.get("next") ?? "/account");
  const parentId = token ? await consumeLoginToken(token) : null;
  if (!parentId) redirect("/account/login?expired=1");
  await startSession(parentId);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

/**
 * The emailed link lands here and the parent taps "Sign in". Using a button
 * (a POST) means email security scanners that open links can't use up the
 * single-use token before the parent does.
 */
export default async function Verify({ searchParams }: { searchParams: Promise<{ t?: string; next?: string }> }) {
  const { t = "", next = "/account" } = await searchParams;
  return (
    <div className="stripes" style={{ padding: "48px 0", minHeight: "60vh" }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <form action={signIn} className="card" style={{ textAlign: "center" }}>
          <h1 className="script" style={{ fontSize: 42 }}>
            Welcome back
          </h1>
          <input type="hidden" name="t" value={t} />
          <input type="hidden" name="next" value={next} />
          <button className="btn" type="submit" autoFocus>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
