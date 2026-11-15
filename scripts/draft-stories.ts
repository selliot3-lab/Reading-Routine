/**
 * Grows the bedtime story library. For each interest, picks three Spark Words
 * from the bank that the library uses least, asks Claude for a story built
 * around them, checks it, and saves it to content/stories.json as a draft
 * (approved: false) for the founder to read.
 *
 * Run: npm run stories:draft -- --interest dinosaurs --count 5
 *      npm run stories:draft -- --all --count 2
 * No child data is used: stories are written with placeholders.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { INTERESTS, SPARK_WORDS } from "../src/lib/content";
import { checkStory, type StoryTemplate } from "../src/lib/story/library";
import { draftStoryTemplate } from "../src/lib/story/generate";

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const PATH = "content/stories.json";

async function main() {
  const file = JSON.parse(readFileSync(PATH, "utf8")) as { _about: string; stories: StoryTemplate[] };
  const interests = process.argv.includes("--all") ? INTERESTS.map((i) => i.id) : [arg("interest", "dinosaurs")!];
  const count = Number(arg("count", "1"));
  for (const interest of interests) {
    for (let n = 0; n < count; n++) {
      const uses = (w: string) => file.stories.filter((s) => s.sparkWords.includes(w)).length;
      const words = SPARK_WORDS.filter((w) => w.interests.includes(interest))
        .sort((a, b) => uses(a.word) - uses(b.word) || Math.random() - 0.5)
        .slice(0, 3);
      if (words.length < 3) throw new Error(`Not enough Spark Words for ${interest}`);
      const draft = await draftStoryTemplate({
        interest,
        sparkWords: words,
        avoidTitles: file.stories.filter((s) => s.interest === interest).map((s) => s.title),
      });
      const story: StoryTemplate = {
        id: `${interest}-${Date.now().toString(36)}`,
        interest,
        approved: false,
        sparkWords: words.map((w) => w.word),
        ...draft,
      };
      const issues = checkStory(story);
      console.log(`${issues.length ? "✗" : "✓"} ${story.title}${issues.length ? ": " + issues.join("; ") : ""}`);
      if (!issues.length) {
        file.stories.push(story);
        writeFileSync(PATH, JSON.stringify(file, null, 2) + "\n");
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
