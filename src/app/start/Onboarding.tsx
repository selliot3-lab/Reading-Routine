"use client";

import { useEffect, useMemo, useState } from "react";
import { PlacementTest } from "./PlacementTest";

type Interest = { id: string; label: string };
type Checkpoint = { level: number; words: string[] };
type Person = { name: string; relation: string };
type Pet = { name: string; kind: string };
export type ChildDraft = {
  firstName: string;
  age: string;
  pronouns: "she" | "he" | "they";
  interests: string[];
  favouriteThings: string;
  specialPeople: Person[];
  pets: Pet[];
  placement: Record<number, boolean[]> | null;
  level: number | null;
};

const emptyChild = (): ChildDraft => ({
  firstName: "",
  age: "",
  pronouns: "they",
  interests: [],
  favouriteThings: "",
  specialPeople: [{ name: "", relation: "" }],
  pets: [],
  placement: null,
  level: null,
});

type Step = "parent" | "child" | "placement" | "time" | "review";

export function Onboarding(props: { interests: Interest[]; checkpoints: Checkpoint[]; timezones: { id: string; label: string }[] }) {
  const [step, setStep] = useState<Step>("parent");
  const [email, setEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [kids, setKids] = useState<ChildDraft[]>([emptyChild()]);
  const [active, setActive] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("18:00");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) setTimezone(tz);
  }, []);

  const child = kids[active];
  const update = (patch: Partial<ChildDraft>) => setKids((ks) => ks.map((k, i) => (i === active ? { ...k, ...patch } : k)));
  const zoneOptions = useMemo(
    () => (props.timezones.some((t) => t.id === timezone) ? props.timezones : [{ id: timezone, label: timezone }, ...props.timezones]),
    [props.timezones, timezone],
  );

  function go(next: Step) {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateChild(): string | null {
    if (!child.firstName.trim()) return "Please add your child's first name.";
    const age = Number(child.age);
    if (!age || age < 3 || age > 12) return "Please add your child's age (3 to 12).";
    if (child.interests.length === 0 && !child.favouriteThings.trim()) return "Pick at least one thing they love.";
    return null;
  }

  async function submit() {
    if (!consent) return setError("Please agree to the privacy terms to continue.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: parentName,
          deliveryTime,
          timezone,
          consent,
          children: kids.map((k) => ({
            firstName: k.firstName.trim(),
            age: Number(k.age),
            pronouns: k.pronouns,
            interests: k.interests,
            favouriteThings: k.favouriteThings.trim() || null,
            specialPeople: k.specialPeople.filter((p) => p.name.trim()),
            pets: k.pets.filter((p) => p.name.trim()),
            placement: k.placement ?? {},
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      window.location.href = data.redirect;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const stepNumber = { parent: 1, child: 2, placement: 3, time: 4, review: 5 }[step];

  return (
    <div className="card">
      <div className="kicker" style={{ textAlign: "center" }}>
        step {stepNumber} of 5
      </div>

      {step === "parent" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
            go("child");
          }}
        >
          <h1 className="script" style={{ fontSize: 44, textAlign: "center" }}>
            Let&apos;s get started
          </h1>
          <p className="muted" style={{ textAlign: "center" }}>
            Your 14-day free trial starts today. Each day&apos;s reading routine arrives at this email.
          </p>
          <div className="field">
            <label htmlFor="email">Your email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pname">Your first name</label>
            <input id="pname" type="text" autoComplete="given-name" value={parentName} onChange={(e) => setParentName(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit">
            Next: about your child
          </button>
        </form>
      )}

      {step === "child" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const err = validateChild();
            if (err) return setError(err);
            go("placement");
          }}
        >
          <h1 className="script" style={{ fontSize: 40, textAlign: "center" }}>
            {kids.length > 1 ? `Child ${active + 1}` : "About your reader"}
          </h1>
          <p className="muted" style={{ textAlign: "center" }}>
            Their stories are built from what you share here. You can change it anytime.
          </p>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="cname">First name</label>
              <input id="cname" type="text" value={child.firstName} onChange={(e) => update({ firstName: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="cage">Age</label>
              <input id="cage" type="number" inputMode="numeric" min={3} max={12} value={child.age} onChange={(e) => update({ age: e.target.value })} required />
            </div>
          </div>
          <fieldset className="field" style={{ border: "none", padding: 0, margin: "0 0 18px" }}>
            <legend style={{ fontWeight: 700, marginBottom: 6 }}>In stories, call {child.firstName || "them"}…</legend>
            <div className="chips">
              {(["she", "he", "they"] as const).map((p) => (
                <button type="button" key={p} className="chip" aria-pressed={child.pronouns === p} onClick={() => update({ pronouns: p })}>
                  {p}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="field" style={{ border: "none", padding: 0, margin: "0 0 18px" }}>
            <legend style={{ fontWeight: 700, marginBottom: 6 }}>What do they love? Pick as many as you like.</legend>
            <div className="chips">
              {props.interests.map((i) => {
                const on = child.interests.includes(i.id);
                return (
                  <button
                    type="button"
                    key={i.id}
                    className="chip"
                    aria-pressed={on}
                    onClick={() => update({ interests: on ? child.interests.filter((x) => x !== i.id) : [...child.interests, i.id] })}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="fav">Anything else they&apos;re into right now?</label>
            <textarea
              id="fav"
              placeholder="e.g. Paw Patrol, the colour purple, their stuffed bunny Mr. Hops, learning about volcanoes"
              value={child.favouriteThings}
              onChange={(e) => update({ favouriteThings: e.target.value })}
            />
          </div>

          <h2 style={{ fontSize: 18, marginTop: 8 }}>Special people</h2>
          <p className="hint" style={{ marginTop: -4 }}>
            Friends, siblings, grandparents, cousins: anyone who&apos;d be exciting to find in a story.
          </p>
          {child.specialPeople.map((p, i) => (
            <div className="grid-2" key={i} style={{ marginBottom: 10 }}>
              <input
                type="text"
                aria-label={`Special person ${i + 1} name`}
                placeholder="Name, e.g. Nana"
                value={p.name}
                onChange={(e) => update({ specialPeople: child.specialPeople.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
              />
              <input
                type="text"
                aria-label={`Special person ${i + 1} relationship`}
                placeholder="Who they are, e.g. grandma, best friend"
                value={p.relation}
                onChange={(e) => update({ specialPeople: child.specialPeople.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)) })}
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => update({ specialPeople: [...child.specialPeople, { name: "", relation: "" }] })}>
            + Add a person
          </button>

          <h2 style={{ fontSize: 18, marginTop: 24 }}>Pets</h2>
          {child.pets.map((p, i) => (
            <div className="grid-2" key={i} style={{ marginBottom: 10 }}>
              <input
                type="text"
                aria-label={`Pet ${i + 1} name`}
                placeholder="Name, e.g. Biscuit"
                value={p.name}
                onChange={(e) => update({ pets: child.pets.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
              />
              <input
                type="text"
                aria-label={`Pet ${i + 1} kind`}
                placeholder="What kind, e.g. dog"
                value={p.kind}
                onChange={(e) => update({ pets: child.pets.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)) })}
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => update({ pets: [...child.pets, { name: "", kind: "" }] })}>
            + Add a pet
          </button>

          {error && <p className="error">{error}</p>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <button type="button" className="btn btn-ghost" onClick={() => go(active > 0 ? "placement" : "parent")}>
              Back
            </button>
            <button className="btn" type="submit">
              Next: reading check
            </button>
          </div>
        </form>
      )}

      {step === "placement" && (
        <PlacementTest
          key={active}
          childName={child.firstName}
          checkpoints={props.checkpoints}
          done={child.level}
          onDone={(placement, level) => update({ placement, level })}
          onRedo={() => update({ placement: null, level: null })}
          onNext={() => go("time")}
          onAddSibling={() => {
            setKids((ks) => [...ks, emptyChild()]);
            setActive(kids.length);
            go("child");
          }}
          onBack={() => go("child")}
        />
      )}

      {step === "time" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go("review");
          }}
        >
          <h1 className="script" style={{ fontSize: 40, textAlign: "center" }}>
            When should it arrive?
          </h1>
          <p className="muted" style={{ textAlign: "center" }}>
            Pick a time a little before your bedtime routine, so you have time to print it or pull it up.
          </p>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="time">Delivery time</label>
              <input id="time" type="time" step={900} value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} required />
              <p className="hint">Emails go out within 15 minutes of this time.</p>
            </div>
            <div className="field">
              <label htmlFor="tz">Time zone</label>
              <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {zoneOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost" onClick={() => go("placement")}>
              Back
            </button>
            <button className="btn" type="submit">
              Next: review
            </button>
          </div>
        </form>
      )}

      {step === "review" && (
        <div>
          <h1 className="script" style={{ fontSize: 40, textAlign: "center" }}>
            All set?
          </h1>
          <ul>
            {kids.map((k, i) => (
              <li key={i}>
                <strong>{k.firstName}</strong>, age {k.age}: starting at {k.level ? `Level ${k.level}` : "Level 1"}
                {i > 0 && <span className="muted"> (+$8/month)</span>}
              </li>
            ))}
          </ul>
          <p>
            Daily at <strong>{deliveryTime}</strong> to <strong>{email}</strong>.
          </p>
          <p>
            14 days free, then <strong>${10 + 8 * (kids.length - 1)} CAD a month</strong>. Cancel anytime from your account.
          </p>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 400 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 22, height: 22, marginTop: 3 }} />
            <span>
              I&apos;m this child&apos;s parent or guardian, and I agree to the <a href="/privacy" target="_blank">privacy policy</a> and{" "}
              <a href="/terms" target="_blank">terms</a>. My child&apos;s information is stored in Canada and used only to make their
              stories.
            </span>
          </label>
          {error && <p className="error">{error}</p>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => go("time")}>
              Back
            </button>
            <button type="button" className="btn" disabled={busy} onClick={submit}>
              {busy ? "One moment…" : "Start my free trial"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
