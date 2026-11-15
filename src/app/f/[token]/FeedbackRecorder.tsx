"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveFeedback } from "./actions";

const LABELS = { too_hard: "too hard", just_right: "just right", too_easy: "too easy" } as const;

export function FeedbackRecorder(props: { token: string; value: keyof typeof LABELS; name: string }) {
  const [state, setState] = useState<"saving" | "saved" | "error">("saving");
  const [steppedBackTo, setSteppedBackTo] = useState<number | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    saveFeedback(props.token, props.value)
      .then((r) => {
        if (!r.ok) return setState("error");
        if (r.changed) setSteppedBackTo(r.level);
        setState("saved");
      })
      .catch(() => setState("error"));
  }, [props.token, props.value]);

  if (state === "saving") return <p aria-live="polite">Saving…</p>;
  if (state === "error") return <p>Sorry, that didn&apos;t save. Please try the link again.</p>;
  const { name, value } = props;
  return (
    <div aria-live="polite">
      <h1 className="script" style={{ fontSize: 44 }}>
        Thank you!
      </h1>
      <p>
        We&apos;ve noted that tonight felt <strong>{LABELS[value]}</strong> for {name}.
      </p>
      {steppedBackTo ? (
        <p>
          It&apos;s been a bit hard a few nights in a row, so {name} will go back to <strong>Level {steppedBackTo}</strong> for a
          while to build confidence.
        </p>
      ) : value === "too_easy" ? (
        <p className="muted">Three too-easy nights in a row and {name} moves up to the next level.</p>
      ) : value === "too_hard" ? (
        <p className="muted">One tricky night is normal. If it keeps feeling hard, we&apos;ll step back a level.</p>
      ) : (
        <p className="muted">Perfect. See you tomorrow!</p>
      )}
      <Link href="/account" className="btn btn-ghost">
        Your account
      </Link>
    </div>
  );
}
