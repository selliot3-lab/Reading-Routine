import readersData from "../../content/readers.json";
import sparkData from "../../content/spark-words.json";
import teachingData from "../../content/teaching-books.json";
import { LEVELS, tokenize, undecodableWords } from "./curriculum";

/** A picture in a sound book's picture hunt: colour it if its name has the sound. */
export type HuntItem = { word: string; has: boolean; pictureBrief: string; picture: string | null };

/**
 * One page of a little book. Story pages are just text and a picture. Teaching
 * books (sound books and heart-word books) use activity pages, set by `kind`:
 *  - meet:   meet the sound (big letters, keyword picture, how to say it)
 *  - hunt:   colour the pictures with the sound
 *  - listen: the grown-up reads words; clap for the sound
 *  - find:   circle every target in a grid
 *  - robot:  sound boxes to tap and blend
 *  - silly:  a silly sentence to read together
 *  - heart:  a heart word, with a sentence that uses it
 *  - talk:   words to say sentences with, or to read fast
 */
export type ReaderPage = {
  text: string;
  pictureBrief: string;
  picture: string | null;
  kind?: "meet" | "hunt" | "listen" | "find" | "robot" | "silly" | "heart" | "talk";
  /** Shown large: the letters on a meet page, the word on a heart page, the target on a find page. */
  display?: string;
  /** A short instruction for the grown-up. */
  prompt?: string;
  items?: HuntItem[];
  words?: string[];
  grid?: string[];
  segments?: string[][];
};
export type Reader = {
  id: string;
  level: number;
  title: string;
  pages: ReaderPage[];
  /** Words the founder approved for this book even though they're taught later (e.g. "and" in a Level 1 book). */
  approvedWords?: string[];
  /** story (default) · sound (a sound book) · heart (a heart-word book) */
  type?: "story" | "sound" | "heart";
  /** For sound books, how to say the sound, e.g. "/m/". */
  say?: string;
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

/** Sound books (one per new sound) and heart-word books (one per level). */
export const TEACHING: Reader[] = teachingData.books as Reader[];

/**
 * The teaching books that open a level, in order: a sound book for each new
 * sound, then the level's heart-word book. Story readers come after.
 */
export function teachingBooksFor(level: number): Reader[] {
  return [
    ...TEACHING.filter((b) => b.type === "sound" && b.level === level),
    ...TEACHING.filter((b) => b.type === "heart" && b.level === level),
  ];
}

/** Heart-word nights also get the colour-by-heart-word sheet. */
export const isHeartBook = (r: Reader | null) => r?.type === "heart";

export function readerById(id: string | null | undefined): Reader | null {
  return READERS.find((r) => r.id === id) ?? TEACHING.find((r) => r.id === id) ?? null;
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
