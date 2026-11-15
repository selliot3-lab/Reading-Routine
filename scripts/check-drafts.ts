/** Checks draft readers (JSON array of Reader) for decodability, page count and length. Usage: tsx scripts/check-drafts.ts file.json */
import { readFileSync } from "node:fs";
import { readerLengthTarget, tokenize, undecodableWords } from "../src/lib/curriculum";
import type { Reader } from "../src/lib/content";

const books = JSON.parse(readFileSync(process.argv[2], "utf8")) as Reader[];
let bad = 0;
for (const b of books) {
  const text = [b.title, ...b.pages.map((p) => p.text)].join(" ");
  const words = tokenize(b.pages.map((p) => p.text).join(" ")).length;
  const t = readerLengthTarget(b.level);
  const issues: string[] = [];
  const u = undecodableWords(text, b.level, b.approvedWords ?? []);
  if (u.length) issues.push(`not taught: ${u.join(", ")}`);
  if (b.pages.length !== 6) issues.push(`${b.pages.length} pages`);
  if (words < t.min || words > t.max) issues.push(`${words} words (target ${t.min}-${t.max})`);
  if (issues.length) { bad++; console.log(`✗ ${b.id}: ${issues.join(" · ")}`); }
}
console.log(`${books.length} drafts, ${bad} with issues`);
