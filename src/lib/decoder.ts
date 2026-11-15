/**
 * Decodability by level, following the scope & sequence.
 *
 * A word is decodable at a level when it can be split into spelling units
 * (letters, digraphs, vowel teams) that have all been taught by that level,
 * arranged into syllable types that have been taught (closed syllables first,
 * then silent-e, open syllables and longer words, -le, r-controlled vowels and
 * vowel teams), after removing any endings or prefixes taught by that level.
 *
 * It is deliberately a little strict. Heart words and the level word lists are
 * handled separately (see curriculum.ts), so a word this rejects can still be
 * allowed there or approved for a single book.
 */

type Unit = { text: string; vowel: boolean; level: number };

/** Consonant spelling units and the level each is taught. */
const CONSONANTS: Record<string, number> = {
  m: 1, s: 1, t: 1,
  p: 2, f: 2, n: 2,
  d: 3,
  c: 4, g: 4,
  b: 5,
  k: 6, h: 6,
  r: 7, l: 7,
  w: 8, j: 8, y: 8,
  x: 9, qu: 9, v: 9, z: 9,
  ff: 13, ll: 13, ss: 13, zz: 13,
  ck: 14, sh: 14,
  th: 15,
  ch: 16,
  wh: 17, ph: 17, ng: 17, nk: 17,
  tch: 23, dge: 23,
  kn: 35, wr: 35, mb: 35,
  gn: 39, gh: 39,
};

/** Vowel spelling units (a syllable's vowel sound) and the level each is taught. */
const VOWELS: Record<string, number> = {
  a: 1, i: 2, o: 3, u: 4, e: 5,
  ar: 25, or: 25, ore: 25,
  er: 26, ir: 26, ur: 26,
  ai: 27, ay: 27,
  ee: 28, ea: 28, ey: 28,
  oa: 29, ow: 29, oe: 29,
  ie: 30, igh: 30,
  oo: 31,
  ew: 32, ui: 32, ue: 32,
  au: 33, aw: 33, augh: 33,
  oi: 34, oy: 34, ou: 34,
  air: 39, are: 39, ear: 39, eigh: 39, ough: 39,
  tion: 40, sion: 40, ture: 40,
};

const SHORT = new Set(["a", "e", "i", "o", "u"]);
/** Level silent-e (VCe) is taught for each vowel. */
const VCE: Record<string, number> = { a: 18, i: 18, o: 19, e: 19, u: 19 };

const OPEN_SYLLABLES = 22; // open syllables and words of more than one syllable
const FINAL_Y = 24; // y as a vowel at the end of a word (my, happy)
const CONSONANT_LE = 24; // -le (little, apple)
const SOFT_C = 20;
const SILENT_E_AFTER_TWO = 20; // dance, fence, hinge

/** Whole-word patterns taught at a specific level, checked before parsing. */
const PATTERN_GATES: [RegExp, number][] = [
  [/(ild|ind|old|olt|ost)$/, 24], // child, kind, cold, colt, most (short words like "wind", "lost" are in the word lists)
  [/^(kn|wr)|mb$/, 35],
  [/tch|dge/, 23],
  [/ear|air|eigh|ough/, 39],
  [/[^a]are$|^.are$/, 39], // care, share (but "are" itself is a heart word)
  [/wa(sh|tch|nt|nd|sp|n$)/, 33], // wash, watch, want
  [/gn$|^gn|^gh/, 39], // sign, gnome, ghost
  [/wor/, 26], // word, work
  [/[aeiou](ge|ce)$|n(ce|ge)$/, 20], // page, face, dance, hinge
];

function units(level: number): { cons: [string, number][]; vows: [string, number][] } {
  const cons = Object.entries(CONSONANTS).filter(([, l]) => l <= level);
  const vows = Object.entries(VOWELS).filter(([, l]) => l <= level);
  // Longest spellings first, so "tch" wins over "t" + "ch".
  cons.sort((a, b) => b[0].length - a[0].length);
  vows.sort((a, b) => b[0].length - a[0].length);
  return { cons, vows };
}

/** Every way to split `w` into taught units. Small words, so this stays tiny. */
function parses(w: string, level: number): Unit[][] {
  const { cons, vows } = units(level);
  const out: Unit[][] = [];
  const walk = (i: number, acc: Unit[]) => {
    if (out.length > 24) return;
    if (i === w.length) {
      out.push(acc);
      return;
    }
    for (const [v, l] of vows) if (w.startsWith(v, i)) walk(i + v.length, [...acc, { text: v, vowel: true, level: l }]);
    for (const [c, l] of cons) if (w.startsWith(c, i)) walk(i + c.length, [...acc, { text: c, vowel: false, level: l }]);
    // Final "y" as a vowel (my, happy), from Level 24.
    if (w[i] === "y" && i === w.length - 1 && i > 0 && level >= FINAL_Y) walk(i + 1, [...acc, { text: "y", vowel: true, level: FINAL_Y }]);
  };
  walk(0, []);
  return out;
}

/** Checks one split of a word (no endings) against the syllable rules for `level`. */
function validParse(us: Unit[], level: number): boolean {
  if (!us.length) return false;
  let list = [...us];

  // -le at the end (lit-tle, ap-ple): its own syllable, from Level 24.
  let extraSyllables = 0;
  const n = list.length;
  if (n >= 3 && list[n - 1].text === "e" && list[n - 2].text === "l" && !list[n - 3].vowel) {
    if (level < CONSONANT_LE) return false;
    list = list.slice(0, -2);
    extraSyllables = 1;
  }

  // Silent e at the end.
  const last = list[list.length - 1];
  if (last.text === "e" && list.length >= 3) {
    // Find the vowel before it and count the consonant units in between.
    let j = list.length - 2;
    let between = 0;
    while (j >= 0 && !list[j].vowel) { between++; j--; }
    if (j >= 0 && between >= 1) {
      const v = list[j];
      const c = list[j + 1];
      if (between === 1 && SHORT.has(v.text) && c.text.length === 1 && !"xwyh".includes(c.text)) {
        // VCe: make, ride, home. With r (more, fire) it is r-controlled, taught from Level 25.
        if (level < VCE[v.text] || (c.text === "r" && level < 25)) return false;
        list = [...list.slice(0, j), { ...v, text: `${v.text}_e`, level: VCE[v.text] }, ...list.slice(j + 1, -1)];
      } else if (level >= SILENT_E_AFTER_TWO) {
        // dance, fence, horse, house: the e just marks the word's ending.
        list = list.slice(0, -1);
      } else return false;
    }
  }

  const vowelIdx = list.flatMap((u, i) => (u.vowel ? [i] : []));
  const syllables = vowelIdx.length + extraSyllables;
  if (vowelIdx.length === 0) return false;
  if (syllables > 1 && level < OPEN_SYLLABLES) return false;

  // Two vowel units side by side (di-et) are not taught, except before -tion, -sion, -ture (sta-tion).
  for (let i = 1; i < list.length; i++) {
    if (list[i].vowel && list[i - 1].vowel && !["tion", "sion", "ture"].includes(list[i].text)) return false;
  }

  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    if (u.vowel) continue;
    const prev = list[i - 1];
    const next = list[i + 1];
    // w, y and h are consonants only before a vowel (wet, yes, hat): "saw", "toy", "high" use vowel teams.
    if ((u.text === "w" || u.text === "y" || u.text === "h") && !next?.vowel) return false;
    // h after a consonant is a digraph (sh, th, ch), taught separately.
    if (u.text === "h" && prev && !prev.vowel) return false;
    // c then k is "ck"; n then k/g at a syllable end is "nk"/"ng".
    if (u.text === "c" && next?.text === "k") return false;
    if (u.text === "n" && (next?.text === "k" || next?.text === "g") && !list[i + 2]?.vowel) return false;
    // A short vowel then r that ends the syllable is r-controlled (car, her), taught from Levels 25-26.
    if (u.text === "r" && prev && SHORT.has(prev.text) && !next?.vowel && next?.text !== "r") return false;
  }

  // Double consonants (ff, ll, ss, zz) only from Level 13, and never other doubles in one syllable.
  for (let i = 1; i < list.length; i++) {
    if (!list[i].vowel && !list[i - 1].vowel && list[i].text === list[i - 1].text && syllables === 1) return false;
  }

  if (syllables === 1) {
    const vi = vowelIdx[0];
    const v = list[vi];
    // Before open syllables, a single short vowel must be closed by a consonant.
    if (SHORT.has(v.text) && vi === list.length - 1 && level < OPEN_SYLLABLES) return false;
    // Consonant clusters: CVC to Level 9, two-letter blends from 10, three from 12.
    const maxCluster = level >= 12 ? 3 : level >= 10 ? 2 : 1;
    const before = vi;
    const after = list.length - vi - 1;
    if (before > maxCluster || after > maxCluster) return false;
    // CCVCC and CCCVC words come at Level 12.
    if (level < 12 && before + after > 3) return false;
    // y is a consonant only at the start.
    if (list.slice(1).some((u) => u.text === "y" && !u.vowel)) return false;
  }
  return true;
}

function decodableStem(w: string, level: number): boolean {
  for (const [re, gate] of PATTERN_GATES) if (re.test(w) && level < gate) return false;
  // Soft c (cent, city) from Level 20.
  if (/c[eiy]/.test(w.replace(/ch/g, "")) && level < SOFT_C) return false;
  return parses(w, level).some((p) => validParse(p, level));
}

const SUFFIXES: [string, number][] = [
  ["s", 6],
  ["es", 21], ["ed", 21], ["ing", 21],
  ["er", 36], ["est", 36], ["ly", 36], ["less", 36], ["ful", 36],
  ["ness", 40], ["ment", 40], ["able", 40], ["or", 40], ["ist", 40], ["ish", 40], ["y", 40],
];
const PREFIXES: [string, number][] = [
  ["un", 37], ["re", 37], ["pre", 37], ["dis", 37],
  ["uni", 40], ["bi", 40], ["tri", 40],
];
const SPELLING_CHANGES = 38; // hopping, baking, cried

/**
 * True when a child at `level` can sound out `word` using what has been taught.
 * `known` lets a stem count when it is a known word (heart word or word list).
 */
export function isDecodable(word: string, level: number, known?: (w: string) => boolean, depth = 0): boolean {
  const w = word.toLowerCase().replace(/[’']/g, "");
  if (!/^[a-z]+$/.test(w)) return false;
  if (known?.(w) && depth > 0) return true;
  if (decodableStem(w, level)) return true;
  if (depth > 2) return false;

  // A stem must be a real-looking word: not "se" + "ed" (seed) or "kis" + "s" (kiss).
  const stemOk = (s: string) =>
    Boolean(known?.(s)) || (s.length >= 3 && !SHORT.has(s.at(-1)!) && isDecodable(s, level, known, depth + 1));

  for (const [suf, gate] of SUFFIXES) {
    if (level < gate || !w.endsWith(suf) || w.length <= suf.length + 1) continue;
    if (suf === "s" && w.endsWith("ss")) continue;
    const base = w.slice(0, -suf.length);
    if (stemOk(base)) return true;
    if (level >= SPELLING_CHANGES) {
      // hop-p-ing, bak(e)-ing, cr(y)-ied, happ(y)-iest
      if (base.length > 2 && base.at(-1) === base.at(-2) && stemOk(base.slice(0, -1))) return true;
      if (stemOk(base + "e")) return true;
      if (base.endsWith("i") && stemOk(base.slice(0, -1) + "y")) return true;
    }
    // -ed and -es after a word ending in e (liked, rides) are spelling changes too.
  }
  for (const [pre, gate] of PREFIXES) {
    if (level >= gate && w.startsWith(pre) && w.length > pre.length + 1 && stemOk(w.slice(pre.length))) return true;
  }
  return false;
}
