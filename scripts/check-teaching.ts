/** Checks the teaching books: robot-talk words and heart-word sentences must be decodable at the book's level. */
import teaching from "../content/teaching-books.json";
import { undecodableWords } from "../src/lib/curriculum";

let bad = 0;
type Page = { kind: string; text: string; words?: string[]; grid?: string[]; columns?: { words: string[] }[]; items?: { word: string }[]; sums?: string[][] };
for (const b of teaching.books as unknown as { id: string; level: number; pages: Page[] }[]) {
  for (const pg of b.pages) {
    // Everything the child reads must be decodable: sentences, word sorts, word hunts, fill-ins and word sums.
    // (Letter books from Level 10 down are about sounds and pictures; poems are read aloud by the grown-up.)
    const childReads: Record<string, () => string[]> = {
      heart: () => [pg.text],
      sort: () => (pg.columns ?? []).flatMap((c) => c.words),
      fill: () => (pg.items ?? []).map((i) => i.word),
      readDraw: () => pg.words ?? [],
      sums: () => (pg.sums ?? []).map((x) => x[2]),
      find: () => (b.level >= 10 ? pg.grid ?? [] : []),
    };
    const text = (childReads[pg.kind]?.() ?? []).join(" ");
    const u = undecodableWords(text, b.level);
    if (u.length) { bad++; console.log(`✗ ${b.id} ${pg.kind}: ${u.join(", ")}`); }
  }
}
console.log(`${teaching.books.length} teaching books, ${bad} pages with untaught words`);
