import readersData from "../../content/readers.json";
import sparkData from "../../content/spark-words.json";
import { undecodableWords } from "./curriculum";

export type ReaderPage = { text: string; pictureBrief: string; picture: string | null };
export type Reader = { id: string; level: number; title: string; pages: ReaderPage[] };
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
    return { id: r.id, level: r.level, problems: undecodableWords(text, r.level) };
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

export function readerById(id: string | null | undefined): Reader | null {
  return READERS.find((r) => r.id === id) ?? null;
}
