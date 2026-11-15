/** Checks the teaching books: robot-talk words and heart-word sentences must be decodable at the book's level. */
import teaching from "../content/teaching-books.json";
import { undecodableWords } from "../src/lib/curriculum";

let bad = 0;
for (const b of teaching.books as { id: string; level: number; pages: { kind: string; text: string; segments?: string[][] }[] }[]) {
  for (const pg of b.pages) {
    const text = pg.kind === "robot" ? (pg.segments ?? []).map((s) => s.join("")).join(" ") : pg.kind === "heart" ? pg.text : "";
    const u = undecodableWords(text, b.level);
    if (u.length) { bad++; console.log(`✗ ${b.id} ${pg.kind}: ${u.join(", ")}`); }
  }
}
console.log(`${teaching.books.length} teaching books, ${bad} pages with untaught words`);
