/**
 * Drafts new decodable readers for a level with Claude, keeps only drafts
 * where every word passes the decodability check, and appends them to
 * content/readers.json for a teacher to review.
 *
 *   npm run content:readers -- --level 7 --count 5
 *
 * Needs STORY_ENGINE=bedrock and AWS credentials (Bedrock, ca-central-1).
 */
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod/v4";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { claude } from "../src/lib/story/claude";
import { env } from "../src/lib/env";
import { allowedWords, getLevel, readerLengthTarget, undecodableWords } from "../src/lib/curriculum";
import type { Reader } from "../src/lib/content";

const arg = (name: string, d: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : d;
};

const Draft = z.object({
  title: z.string(),
  pages: z.array(z.object({ text: z.string(), pictureBrief: z.string() })),
});

async function main() {
  const level = Number(arg("level", "7"));
  const count = Number(arg("count", "5"));
  if (env.STORY_ENGINE !== "bedrock") throw new Error("Set STORY_ENGINE=bedrock (and AWS credentials) to draft readers.");
  const lv = getLevel(level);
  const words = [...allowedWords(level)].sort();
  const len = readerLengthTarget(level);
  const file = "content/readers.json";
  const lib = JSON.parse(await readFile(file, "utf8")) as { _about: string; readers: Reader[] };
  const titles = new Set(lib.readers.map((r) => r.title.toLowerCase()));

  let made = 0;
  for (let attempt = 0; attempt < count * 3 && made < count; attempt++) {
    const res = await claude().beta.messages.parse({
      model: env.BEDROCK_MODEL_ID,
      max_tokens: 16000,
      system: [
        {
          type: "text",
          text: `You write decodable readers for children learning to read with a structured phonics program. A decodable reader may use ONLY words from the allowed word list you are given (plus simple sound-it-out words made only of letters already taught). It should still be a real little story with a beginning, middle and end, a bit of humour, and short sentences. Every book has a title and EXACTLY 6 pages (they fill the inside of a fold-up little book). Each page has its words and a brief describing a simple picture that will be drawn as a black-and-white outline for the child to colour (one clear scene, diverse characters). For longer texts at higher levels, pages may be mostly words. Never use a word that is not on the list.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Level ${level}. New pattern: ${lv.patterns}. Use the new pattern often (words like ${lv.sampleWords.join(", ")}).
Length: ${len.min}–${len.max} words in total, over exactly 6 pages. Do not reuse these titles: ${[...titles].join("; ")}.
Allowed words: ${words.join(", ")}`,
        },
      ],
      output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
    });
    const draft = res.parsed_output;
    if (!draft) continue;
    if (draft.pages.length !== 6) {
      console.log(`  ✗ "${draft.title}" has ${draft.pages.length} pages, not 6`);
      continue;
    }
    const text = [draft.title, ...draft.pages.map((p) => p.text)].join(" ");
    const bad = undecodableWords(text, level);
    if (bad.length) {
      console.log(`  ✗ "${draft.title}" used untaught words: ${bad.join(", ")}`);
      continue;
    }
    const slug = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    lib.readers.push({
      id: `L${String(level).padStart(2, "0")}-${slug}`,
      level,
      title: draft.title,
      pages: draft.pages.map((p) => ({ ...p, picture: null })),
    });
    titles.add(draft.title.toLowerCase());
    made++;
    console.log(`  ✓ "${draft.title}"`);
  }
  await writeFile(file, JSON.stringify(lib, null, 2) + "\n");
  console.log(`Added ${made} reader(s) to Level ${level}. Review them, then run npm run content:check.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
