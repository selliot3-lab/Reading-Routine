import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createLoginLink } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { loginEmail } from "@/lib/emails";
import { redirect } from "next/navigation";

async function requestLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parent = await db.query.parents.findFirst({ where: eq(schema.parents.email, email) });
  if (parent) {
    const link = await createLoginLink(parent.id);
    await sendEmail({ to: email, ...loginEmail(link) });
  }
  // Same answer either way, so the form can't be used to check who has an account.
  redirect("/account/login?sent=1");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; expired?: string }> }) {
  const { sent, expired } = await searchParams;
  return (
    <div className="stripes" style={{ padding: "48px 0", minHeight: "60vh" }}>
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="card">
          <h1 className="script" style={{ fontSize: 42, textAlign: "center" }}>
            Sign in
          </h1>
          {sent ? (
            <p>If there&apos;s an account for that email, a sign-in link is on its way. It works once and expires in 30 minutes.</p>
          ) : (
            <form action={requestLink}>
              {expired && <p className="error">That sign-in link has expired or was already used. Get a new one below.</p>}
              <div className="field">
                <label htmlFor="email">Your email</label>
                <input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <button className="btn" type="submit">
                Email me a sign-in link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
