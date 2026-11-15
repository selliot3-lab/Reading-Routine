/** Development check: every word in each level's list should decode at that level. */
import { LEVELS } from "../src/lib/curriculum";
import { isDecodable } from "../src/lib/decoder";

const heart = new Set<string>();
let misses = 0;
for (const l of LEVELS) {
  l.heartWords.forEach((w) => heart.add(w.toLowerCase()));
  const known = (w: string) => heart.has(w);
  const bad = l.words.filter((w) => !isDecodable(w, l.level, known));
  const early = l.words.filter((w) => l.level > 1 && isDecodable(w, l.level - 1, known));
  if (bad.length) { misses += bad.length; console.log(`L${l.level} not decodable: ${bad.join(" ")}`); }
  if (early.length) console.log(`L${l.level} decodable a level early: ${early.join(" ")}`);
}
console.log(`misses: ${misses}`);
