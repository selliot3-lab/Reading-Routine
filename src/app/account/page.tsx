import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { currentParent } from "@/lib/auth";
import { INTERESTS } from "@/lib/content";
import { MAX_LEVEL, getLevel } from "@/lib/curriculum";
import { TIMEZONES, formatLongDate } from "@/lib/time";
import { isStripeConfigured } from "@/lib/env";
import { openBillingPortal, sendNow, setPaused, signOut, updateChild, updateSchedule } from "./actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment needed",
  canceled: "Cancelled",
  incomplete: "Checkout not finished",
  none: "Not started",
};

export default async function Account() {
  const parent = await currentParent();
  if (!parent) redirect("/account/login");
  const kids = await db.query.children.findMany({ where: eq(schema.children.parentId, parent.id) });
  const routines = kids.length
    ? await db.query.routines.findMany({
        where: inArray(
          schema.routines.childId,
          kids.map((k) => k.id),
        ),
        orderBy: desc(schema.routines.forDate),
        limit: 14,
      })
    : [];
  const zones = TIMEZONES.some((t) => t.id === parent.timezone) ? TIMEZONES : [{ id: parent.timezone, label: parent.timezone }, ...TIMEZONES];

  return (
    <div className="container" style={{ maxWidth: 820, padding: "40px 16px" }}>
      <h1 className="script" style={{ fontSize: 48 }}>
        Hi{parent.firstName ? `, ${parent.firstName}` : ""}!
      </h1>
      <p>
        Plan: <strong>{STATUS[parent.subscriptionStatus] ?? parent.subscriptionStatus}</strong>
        {parent.subscriptionStatus === "trialing" && parent.trialEndsAt && (
          <> until {parent.trialEndsAt.toLocaleDateString("en-CA", { month: "long", day: "numeric" })}</>
        )}
        {parent.paused && <> · <strong>Paused</strong></>}
      </p>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2>Delivery</h2>
        <form action={updateSchedule} className="grid-2">
          <div className="field">
            <label htmlFor="deliveryTime">Time</label>
            <input id="deliveryTime" name="deliveryTime" type="time" step={900} defaultValue={parent.deliveryTime} />
          </div>
          <div className="field">
            <label htmlFor="timezone">Time zone</label>
            <select id="timezone" name="timezone" defaultValue={parent.timezone}>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button className="btn" type="submit">
              Save
            </button>
          </div>
        </form>
        <form action={setPaused} style={{ marginTop: 16 }}>
          <input type="hidden" name="paused" value={parent.paused ? "0" : "1"} />
          <button className="btn btn-ghost" type="submit">
            {parent.paused ? "Resume daily emails" : "Pause daily emails (e.g. on holiday)"}
          </button>
        </form>
      </section>

      {kids.map((k) => {
        const level = k.level > MAX_LEVEL ? null : getLevel(k.level);
        return (
          <section key={k.id} className="card" style={{ marginBottom: 20 }}>
            <h2 className="script" style={{ fontSize: 36 }}>
              {k.firstName}
            </h2>
            <p>
              {level ? (
                <>
                  <strong>Level {k.level}</strong> of 40 · {level.patterns}
                </>
              ) : (
                <strong>Chapter books{k.chapterBook ? `: “${k.chapterBook.title}”, chapter ${k.chapterBook.chapter}` : ""}</strong>
              )}
            </p>
            <form action={sendNow} style={{ marginBottom: 16 }}>
              <input type="hidden" name="childId" value={k.id} />
              <button className="btn btn-ghost" type="submit">
                Send today&apos;s routine now
              </button>
            </form>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Edit interests, people and pets</summary>
              <form action={updateChild} style={{ marginTop: 14 }}>
                <input type="hidden" name="childId" value={k.id} />
                <label style={{ fontWeight: 400, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                  <input type="checkbox" name="inReadingProgram" defaultChecked={k.inReadingProgram} style={{ width: 20, height: 20, marginTop: 2 }} />
                  <span>{k.firstName} is in the full reading routine: they get their own little books each night.</span>
                </label>
                <label style={{ fontWeight: 400, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                  <input type="checkbox" name="inStorytime" defaultChecked={k.inStorytime} style={{ width: 20, height: 20, marginTop: 2 }} />
                  <span>Put {k.firstName} in their siblings&apos; bedtime stories. Stories feature every sibling who is in storytime.</span>
                </label>
                <fieldset style={{ border: "none", padding: 0 }}>
                  <legend style={{ fontWeight: 700, marginBottom: 6 }}>Interests</legend>
                  <div className="grid-2" style={{ gap: 4 }}>
                    {INTERESTS.map((i) => (
                      <label key={i.id} style={{ fontWeight: 400, display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="checkbox" name="interests" value={i.id} defaultChecked={k.interests.includes(i.id)} style={{ width: 20, height: 20 }} />
                        {i.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="field" style={{ marginTop: 12 }}>
                  <label htmlFor={`fav-${k.id}`}>Anything else they&apos;re into</label>
                  <textarea id={`fav-${k.id}`} name="favouriteThings" defaultValue={k.favouriteThings ?? ""} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor={`people-${k.id}`}>Special people</label>
                    <textarea
                      id={`people-${k.id}`}
                      name="specialPeople"
                      defaultValue={k.specialPeople.map((p) => `${p.name} - ${p.relation}`).join("\n")}
                    />
                    <p className="hint">One per line, e.g. Nana - grandma</p>
                  </div>
                  <div className="field">
                    <label htmlFor={`pets-${k.id}`}>Pets</label>
                    <textarea id={`pets-${k.id}`} name="pets" defaultValue={k.pets.map((p) => `${p.name} - ${p.kind}`).join("\n")} />
                    <p className="hint">One per line, e.g. Biscuit - dog</p>
                  </div>
                </div>
                <button className="btn" type="submit">
                  Save {k.firstName}&apos;s details
                </button>
              </form>
            </details>
          </section>
        );
      })}

      <section className="card" style={{ marginBottom: 20 }}>
        <h2>Recent routines</h2>
        {routines.length === 0 ? (
          <p className="muted">Your first routine arrives at {parent.deliveryTime}.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {routines.map((r) => {
              const kid = kids.find((k) => k.id === r.childId);
              return (
                <li key={r.id}>
                  {formatLongDate(r.forDate)} · {kid?.firstName} ·{" "}
                  {r.status === "sent" || r.status === "ready" ? (
                    <a href={`/r/${r.token}`}>{r.story?.title ?? "Open"}</a>
                  ) : r.status === "failed" ? (
                    <span className="muted">couldn&apos;t be made, retrying shortly</span>
                  ) : (
                    <span className="muted">{r.status}</span>
                  )}
                  {r.feedback && <span className="muted"> · {r.feedback.replace("_", " ")}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {isStripeConfigured() && parent.stripeCustomerId && (
          <form action={openBillingPortal}>
            <button className="btn btn-ghost" type="submit">
              Billing or cancel
            </button>
          </form>
        )}
        <form action={signOut}>
          <button className="btn btn-ghost" type="submit">
            Sign out
          </button>
        </form>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </div>
    </div>
  );
}
