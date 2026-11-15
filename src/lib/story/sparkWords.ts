import { SPARK_WORDS, type SparkWord } from "../content";

/** Small deterministic PRNG so a child's word picks are stable for a given night. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Picks tonight's three Spark Words from the bank: words tied to the child's
 * interests first (one per interest where possible), then general words.
 * Words the child has already met are skipped. Returns fewer than three only
 * when the bank has run out; the caller then asks the story writer for new words.
 */
export function pickSparkWords(opts: {
  interests: string[];
  alreadyMet: Set<string>;
  seed: string;
  count?: number;
}): SparkWord[] {
  const count = opts.count ?? 3;
  const rand = seeded(opts.seed);
  const fresh = SPARK_WORDS.filter((w) => !opts.alreadyMet.has(w.word.toLowerCase()));
  const shuffle = <T,>(xs: T[]) =>
    xs
      .map((x) => [rand(), x] as const)
      .sort((a, b) => a[0] - b[0])
      .map(([, x]) => x);

  const picked: SparkWord[] = [];
  const interests = shuffle(opts.interests);
  // One word per interest, round-robin, so a dinosaur-and-soccer kid gets both.
  for (let round = 0; picked.length < count && round < 3; round++) {
    for (const interest of interests) {
      if (picked.length >= count) break;
      const options = shuffle(fresh.filter((w) => w.interests.includes(interest) && !picked.includes(w)));
      if (options[0]) picked.push(options[0]);
    }
  }
  if (picked.length < count) {
    const general = shuffle(fresh.filter((w) => w.interests.length === 0 && !picked.includes(w)));
    picked.push(...general.slice(0, count - picked.length));
  }
  if (picked.length < count) {
    const any = shuffle(fresh.filter((w) => !picked.includes(w)));
    picked.push(...any.slice(0, count - picked.length));
  }
  return picked;
}

/** Days between two ISO dates (YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * Words met 14 or 28 days ago come back in tonight's story, so each word is
 * met again 2 and 4 weeks later (from the scope & sequence).
 */
export function pickReviewWords(history: { word: string; firstSeen: string }[], today: string): string[] {
  return history
    .filter((h) => [14, 28].includes(daysBetween(h.firstSeen, today)))
    .map((h) => h.word)
    .slice(0, 2);
}

/** True when `word` (or a simple form of it) appears at least `min` times in `text`. */
export function countWord(text: string, word: string): number {
  const stem = word.toLowerCase().replace(/e$/, "");
  const re = new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]*\\b`, "gi");
  return (text.match(re) ?? []).length;
}
