import readersData from "../../content/readers.json";
import sparkData from "../../content/spark-words.json";
import prereadingData from "../../content/prereading.json";
import { LEVELS, tokenize, undecodableWords } from "./curriculum";

export type ReaderPage = {
  text: string;
  pictureBrief: string;
  picture: string | null;
  /** Pre-reading books: a "sound" page (big letter + keyword) or a "word" page. Story pages leave this out. */
  kind?: "sound" | "word";
  /** For sound pages, the letters shown large, e.g. "Aa" or "-s". */
  display?: string;
};
export type Reader = {
  id: string;
  level: number;
  title: string;
  pages: ReaderPage[];
  /** Words the founder approved for this book even though they're taught later (e.g. "and" in a Level 1 book). */
  approvedWords?: string[];
};
export type SparkWord = {
  word: string;
  interests: string[];
  definition: string;
  introTip: string;
  picture: string | null;
};
export type Interest = { id: string; label: string };

export const READERS: Reader[] = readersData.readers as Reader[];
export const SPARK_WORDS: SparkWord[] = sparkData.words as SparkWord[];
export const INTERESTS: Interest[] = sparkData.interests;

/** Problems with the library: words a child at that level hasn't been taught. */
export function auditReaders(): { id: string; level: number; problems: string[] }[] {
  return READERS.map((r) => {
    const text = [r.title, ...r.pages.map((p) => p.text)].join(" ");
    return { id: r.id, level: r.level, problems: undecodableWords(text, r.level, r.approvedWords ?? []) };
  }).filter((r) => r.problems.length > 0);
}

/**
 * Picks tonight's reader. Children reread readers from their level in order
 * (rereading builds fluency); if a level has no readers yet, the nearest
 * level below that has some is used.
 */
export function pickReader(level: number, routineNumberAtLevel: number): Reader | null {
  for (let l = Math.min(level, 40); l >= 1; l--) {
    const pool = READERS.filter((r) => r.level === l);
    if (pool.length) return pool[routineNumberAtLevel % pool.length];
  }
  return null;
}

/** The pre-reading book for a level: its new sounds with keywords and pictures to colour. */
export const PREREADING: Reader[] = (prereadingData.levels as { level: number; pages: ReaderPage[] }[]).map((l) => ({
  id: `PRE-L${String(l.level).padStart(2, "0")}`,
  level: l.level,
  title: `My Level ${l.level} Sounds`,
  pages: l.pages,
}));

export function prereadingFor(level: number): Reader | null {
  return PREREADING.find((r) => r.level === level) ?? null;
}

export const isPrereading = (r: Reader | null) => Boolean(r?.id.startsWith("PRE-"));

export function readerById(id: string | null | undefined): Reader | null {
  return READERS.find((r) => r.id === id) ?? PREREADING.find((r) => r.id === id) ?? null;
}

/** Crayon colours for the colour-by-heart-word sheet, one per word. */
const CRAYONS = ["red", "blue", "yellow", "green", "orange", "purple"];

export type ColourSheet = { words: { word: string; colour: string }[]; sea: string[]; review: boolean };

/**
 * The colour-by-heart-word sheet for a level: each heart word gets a crayon
 * colour, hidden in a "sea" of 48 words with decodable words mixed in. When a
 * level adds fewer than 3 heart words, the previous level's join for review.
 */
export function colourSheetFor(level: number): ColourSheet | null {
  const lv = LEVELS.find((l) => l.level === level);
  if (!lv) return null;
  let words = lv.heartWords.map((w) => w.toLowerCase());
  let review = false;
  for (let back = level - 1; words.length < 3 && back >= 1; back--) {
    const prev = LEVELS.find((l) => l.level === back)!.heartWords.map((w) => w.toLowerCase());
    words = [...words, ...prev.filter((w) => !words.includes(w))].slice(0, 6);
    review = true;
  }
  words = words.slice(0, CRAYONS.length).map((w) => (w === "i" ? "I" : w));
  // Decodable "other" words to search through: short words from this level and below.
  const others = [
    ...new Set(LEVELS.filter((l) => l.level <= level).flatMap((l) => l.words)),
  ].filter((w) => !words.map((x) => x.toLowerCase()).includes(w.toLowerCase()) && w.length <= 5);
  // Deterministic shuffle so a level's sheet is always the same.
  let seed = level * 9301 + 49297;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const SEA = 48;
  const heartCount = Math.round(SEA * 0.55);
  const sea: string[] = [];
  for (let i = 0; i < heartCount; i++) sea.push(words[i % words.length]);
  for (let i = 0; sea.length < SEA; i++) sea.push(others[Math.floor(rand() * others.length)] ?? "mat");
  for (let i = sea.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sea[i], sea[j]] = [sea[j], sea[i]];
  }
  return { words: words.map((word, i) => ({ word, colour: CRAYONS[i] })), sea, review };
}

/** Heart words taught up to `level` (with the level each was introduced). */
export function heartWordsUpTo(level: number): string[] {
  return LEVELS.filter((l) => l.level <= level).flatMap((l) => l.heartWords.map((w) => w.toLowerCase()));
}

/** The heart words that appear in a book, in the order they first appear: shown on the book's cover. */
export function heartWordsIn(reader: Reader): string[] {
  const hearts = new Set([...heartWordsUpTo(reader.level), ...(reader.approvedWords ?? [])]);
  const seen: string[] = [];
  for (const w of tokenize([reader.title, ...reader.pages.map((p) => p.text)].join(" "))) {
    if (hearts.has(w) && !seen.includes(w)) seen.push(w);
  }
  return seen.map((w) => (w === "i" ? "I" : w));
}
