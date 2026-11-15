"use client";

import { useState } from "react";

type Checkpoint = { level: number; words: string[] };

/**
 * Parent-led placement check. The child reads each word aloud; the parent taps
 * whether they got it. It stops after two misses in a row, or when a group of
 * five has fewer than four right. The child starts at the last group they passed.
 * (The server re-checks the result with the same rule.)
 */
export function PlacementTest(props: {
  childName: string;
  checkpoints: Checkpoint[];
  done: number | null;
  onDone: (results: Record<number, boolean[]>, level: number) => void;
  onRedo: () => void;
  onNext: () => void;
  onAddSibling: () => void;
  onBack: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [cp, setCp] = useState(0);
  const [results, setResults] = useState<Record<number, boolean[]>>({});
  const name = props.childName || "your child";

  if (props.done) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1 className="script" style={{ fontSize: 44 }}>
          Great reading!
        </h1>
        <p style={{ fontSize: 20 }}>
          {name} will start at <strong>Level {props.done}</strong>.
        </p>
        <p className="muted">
          The first week works as a check too: if it feels too easy or too hard, tap that after reading and we&apos;ll adjust.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <button className="btn" onClick={props.onNext}>
            Next: delivery time
          </button>
          <button className="btn btn-ghost" onClick={props.onAddSibling}>
            + Add a brother or sister ($5/month)
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setResults({});
              setCp(0);
              setStarted(false);
              props.onRedo();
            }}
          >
            Redo the check
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div>
        <h1 className="script" style={{ fontSize: 40, textAlign: "center" }}>
          A quick reading check
        </h1>
        <p>This takes about 5 minutes and tells us where {name} should start.</p>
        <ol>
          <li>Sit side by side so {name} can see the screen.</li>
          <li>We&apos;ll show one word at a time. Ask {name} to read it out loud.</li>
          <li>
            Tap <strong>Got it</strong> if they read it correctly within a few seconds, or <strong>Not yet</strong> if not.
            Please don&apos;t help or give hints.
          </li>
          <li>Words get harder as you go. It stops on its own when it&apos;s found the right level.</li>
        </ol>
        <p className="muted small">If {name} doesn&apos;t know their letter sounds yet, tap Not yet twice and they&apos;ll start at Level 1.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={props.onBack}>
            Back
          </button>
          <button className="btn" onClick={() => setStarted(true)}>
            Start the check
          </button>
        </div>
      </div>
    );
  }

  const current = props.checkpoints[cp];
  const marks = results[current.level] ?? [];
  const word = current.words[marks.length];
  const shown = Object.values(results).flat().length + 1;

  function mark(ok: boolean) {
    const next = { ...results, [current.level]: [...marks, ok] };
    setResults(next);
    const these = next[current.level];
    const flat = props.checkpoints.flatMap((c) => next[c.level] ?? []);
    const twoMissesInARow = flat.length >= 2 && !flat[flat.length - 1] && !flat[flat.length - 2];
    const groupDone = these.length === current.words.length;
    const groupFailed = groupDone && these.filter(Boolean).length < 4;
    if (twoMissesInARow || groupFailed) return finish(next, cp - 1);
    if (groupDone) {
      if (cp === props.checkpoints.length - 1) return finish(next, cp);
      setCp(cp + 1);
    }
  }

  function finish(r: Record<number, boolean[]>, passedIndex: number) {
    const level = passedIndex >= 0 ? props.checkpoints[passedIndex].level : props.checkpoints[0].level;
    props.onDone(r, level);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p className="kicker">word {shown}</p>
      <p className="muted small">Ask {name} to read this word:</p>
      <div
        aria-live="polite"
        style={{
          fontFamily: "var(--reader)",
          fontSize: "clamp(56px, 16vw, 104px)",
          lineHeight: 1.1,
          border: "1.5px solid var(--ink)",
          background: "#fffdf8",
          padding: "40px 12px",
          margin: "12px 0 24px",
        }}
      >
        {word}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-ghost" style={{ minWidth: 140 }} onClick={() => mark(false)}>
          Not yet
        </button>
        <button className="btn" style={{ minWidth: 140 }} onClick={() => mark(true)}>
          Got it
        </button>
      </div>
    </div>
  );
}
