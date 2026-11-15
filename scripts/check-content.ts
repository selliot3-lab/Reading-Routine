/**
 * Checks the content library before it reaches a child:
 *  - every word in every decodable reader is taught by the reader's level
 *  - every Spark Word has a definition of 10 words or fewer and an intro tip
 * Run: npm run content:check
 */
import { auditReaders, READERS, SPARK_WORDS, INTERESTS } from "../src/lib/content";

let failed = false;

const problems = auditReaders();
for (const p of problems) {
  failed = true;
  console.log(`✗ ${p.id} (Level ${p.level}): not yet taught → ${p.problems.join(", ")}`);
}
console.log(`Readers: ${READERS.length} checked, ${problems.length} with problems.`);

const counts = new Map<number, number>();
for (const r of READERS) counts.set(r.level, (counts.get(r.level) ?? 0) + 1);
const missing = Array.from({ length: 40 }, (_, i) => i + 1).filter((l) => !counts.has(l));
if (missing.length) console.log(`Levels with no readers yet (nearest lower level is used): ${missing.join(", ")}`);

const ids = new Set(INTERESTS.map((i) => i.id));
for (const w of SPARK_WORDS) {
  const issues: string[] = [];
  if (w.definition.split(/\s+/).length > 10) issues.push("definition over 10 words");
  if (!w.introTip) issues.push("no intro tip");
  for (const i of w.interests) if (!ids.has(i)) issues.push(`unknown interest "${i}"`);
  if (issues.length) {
    failed = true;
    console.log(`✗ Spark Word "${w.word}": ${issues.join("; ")}`);
  }
}
const withPictures = SPARK_WORDS.filter((w) => w.picture).length;
console.log(`Spark Words: ${SPARK_WORDS.length} (${withPictures} with pictures).`);

process.exit(failed ? 1 : 0);
