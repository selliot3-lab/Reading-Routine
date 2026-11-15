/** Checks the bedtime story library: placeholders, Spark Words (3 times each) and length. Run: npm run stories:check */
import { STORIES, checkStory, personalize } from "../src/lib/story/library";

let bad = 0;
for (const s of STORIES) {
  const issues = checkStory(s);
  if (issues.length) bad++;
  console.log(`${issues.length ? "✗" : "✓"} ${s.id} (${s.interest}${s.approved ? "" : ", draft"})${issues.length ? ": " + issues.join("; ") : ""}`);
}
const sample = personalize(STORIES[0], { firstName: "Maya", pronouns: "she", specialPeople: [{ name: "Nana", relation: "grandma" }], pets: [{ name: "Biscuit", kind: "Dog" }] });
console.log(`\nSample: ${sample.title}\n${sample.paragraphs.slice(0, 3).join("\n")}`);
process.exit(bad ? 1 : 0);
