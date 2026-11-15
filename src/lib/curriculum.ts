import levelsData from "../../content/levels.json";

export type Level = {
  level: number;
  patterns: string;
  ufli: string;
  sampleWords: string[];
  heartWords: string[];
  heartBecomesDecodable: string;
  words: string[];
  checkWords: string[];
  checkPassage: string;
};

export const LEVELS: Level[] = levelsData as Level[];
export const MAX_LEVEL = 40;
/** Children above Level 40 have "graduated" into chapter mode. */
export const GRADUATE_LEVEL = 41;

export function getLevel(n: number): Level {
  const l = LEVELS.find((x) => x.level === Math.min(Math.max(n, 1), MAX_LEVEL));
  if (!l) throw new Error(`Unknown level ${n}`);
  return l;
}

export function stageOf(level: number): 1 | 2 | 3 | "graduate" {
  if (level > MAX_LEVEL) return "graduate";
  if (level <= 12) return 1;
  if (level <= 24) return 2;
  return 3;
}

/** Placement checkpoints from the scope & sequence: 5 words from each. */
export const PLACEMENT_CHECKPOINTS = [1, 6, 12, 18, 24, 30, 36];

export function placementWords(level: number): string[] {
  const l = getLevel(level);
  // Prefer the mastery-check words: they were chosen to represent the level.
  const pool = l.checkWords.length >= 5 ? l.checkWords : l.words;
  return pool.slice(0, 5);
}

/**
 * Placement rule from the scope & sequence: the child stops after two misses
 * in a row and is placed at the checkpoint before the one they missed.
 * `results` maps checkpoint level -> per-word booleans, in order shown.
 */
export function placeFromResults(results: Record<number, boolean[]>): number {
  let placed = PLACEMENT_CHECKPOINTS[0];
  for (const cp of PLACEMENT_CHECKPOINTS) {
    const r = results[cp];
    if (!r) break;
    const failed = r.some((ok, i) => !ok && i > 0 && !r[i - 1]) || r.filter(Boolean).length < 4;
    if (failed) break;
    placed = cp;
  }
  return placed;
}

const PLURAL_FROM = 6; // -s plurals taught at Level 6
const ENDINGS_FROM = 21; // -es, -ed, -ing taught at Level 21
const SUFFIXES_FROM = 36; // -er, -est, -ly, -less, -ful

function inflections(word: string, level: number): string[] {
  const w = word.toLowerCase();
  const out: string[] = [];
  if (level >= PLURAL_FROM) out.push(w + "s");
  if (level >= ENDINGS_FROM) {
    out.push(w + "es", w + "ed", w + "ing");
    if (w.endsWith("e")) out.push(w + "d", w.slice(0, -1) + "ing");
    if (/[^aeiou][aeiou][bdgmnpt]$/.test(w)) {
      const d = w + w.at(-1);
      out.push(d + "ed", d + "ing");
    }
  }
  if (level >= SUFFIXES_FROM) out.push(w + "er", w + "est", w + "ly", w + "less", w + "ful");
  return out;
}

/** Single letters / letter teams taught by each level (Stages 1–2, closed syllables). */
const GRAPHEMES_BY_LEVEL: Record<number, string[]> = {
  1: ["a", "m", "s", "t"],
  2: ["p", "f", "i", "n"],
  3: ["o", "d"],
  4: ["c", "u", "g"],
  5: ["b", "e"],
  6: ["k", "h"],
  7: ["r", "l"],
  8: ["w", "j", "y"],
  9: ["x", "qu", "v", "z"],
  13: ["ff", "ll", "ss", "zz"],
  14: ["ck", "sh"],
  15: ["th"],
  16: ["ch"],
  17: ["wh", "ph", "ng", "nk"],
  23: ["tch", "dge"],
};

function taughtGraphemes(level: number): Set<string> {
  const s = new Set<string>();
  for (const [lv, gs] of Object.entries(GRAPHEMES_BY_LEVEL)) {
    if (Number(lv) <= level) gs.forEach((g) => s.add(g));
  }
  return s;
}

/**
 * True when `word` is a one-vowel closed syllable (e.g. "mop", "stomp",
 * "shelf") made only of graphemes taught by `level`, with consonant clusters
 * no longer than the level allows (CVC to Level 9, blends from 10, CCC from 12).
 */
export function isClosedSyllableDecodable(word: string, level: number): boolean {
  const w = word.toLowerCase();
  const g = taughtGraphemes(level);
  const parts: string[] = [];
  for (let i = 0; i < w.length; ) {
    const tri = w.slice(i, i + 3);
    const di = w.slice(i, i + 2);
    if (g.has(tri)) { parts.push(tri); i += 3; }
    else if (g.has(di)) { parts.push(di); i += 2; }
    else if (g.has(w[i])) { parts.push(w[i]); i += 1; }
    else return false;
  }
  const vowels = parts.filter((p) => "aeiou".includes(p));
  if (vowels.length !== 1) return false;
  const vi = parts.findIndex((p) => "aeiou".includes(p));
  const maxCluster = level >= 12 ? 3 : level >= 10 ? 2 : 1;
  // A digraph counts as one sound; the initial-cluster limit allows "str", "spl".
  const before = vi;
  const after = parts.length - vi - 1;
  if (before > maxCluster || after > maxCluster) return false;
  // "y" is only a consonant here, and only at the start.
  if (parts.slice(1).includes("y")) return false;
  return true;
}

const cache = new Map<number, Set<string>>();

/** Every word a child at `level` may meet in their own reader. */
export function allowedWords(level: number): Set<string> {
  const capped = Math.min(level, MAX_LEVEL);
  const hit = cache.get(capped);
  if (hit) return hit;
  const set = new Set<string>();
  for (const l of LEVELS.filter((x) => x.level <= capped)) {
    for (const w of [...l.words, ...l.sampleWords, ...l.checkWords, ...l.heartWords, ...tokenize(l.checkPassage)]) {
      const lw = w.toLowerCase();
      set.add(lw);
      for (const i of inflections(lw, capped)) set.add(i);
    }
  }
  cache.set(capped, set);
  return set;
}

export function tokenize(text: string): string[] {
  return (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).map((w) => w.toLowerCase());
}

/** Returns the words in `text` a child at `level` has not been taught. */
export function undecodableWords(text: string, level: number, extraAllowed: string[] = []): string[] {
  const allowed = allowedWords(level);
  const extra = new Set(extraAllowed.map((w) => w.toLowerCase()));
  return [
    ...new Set(
      tokenize(text).filter((w) => {
        if (allowed.has(w) || extra.has(w)) return false;
        if (isClosedSyllableDecodable(w, level)) return false;
        // plural -s on a sound-it-out word, from Level 6
        if (level >= PLURAL_FROM && w.endsWith("s") && isClosedSyllableDecodable(w.slice(0, -1), level)) return false;
        return true;
      }),
    ),
  ];
}

/** Passage length targets (words) for the child's own reader. */
export function readerLengthTarget(level: number): { min: number; max: number } {
  if (level <= 12) return { min: 12, max: 45 }; // 3-6 sentences
  if (level <= 24) return { min: 30, max: 80 };
  if (level <= 30) return { min: 60, max: 80 };
  if (level <= 35) return { min: 80, max: 110 };
  return { min: 110, max: 150 };
}
