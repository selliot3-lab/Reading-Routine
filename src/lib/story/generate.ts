import { z } from "zod/v4";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { claude } from "./claude";
import { countWord } from "./sparkWords";
import { env } from "../env";
import type { Pet, SpecialPerson } from "../db/schema";

export type StoryChild = {
  firstName: string;
  age: number | null;
  pronouns: string;
  interests: string[];
  favouriteThings: string | null;
  specialPeople: SpecialPerson[];
  pets: Pet[];
};

export type StoryInput = {
  child: StoryChild;
  sparkWords: { word: string; definition: string }[];
  reviewWords: string[];
  /** The phonics pattern the child is working on, e.g. "ck · sh". */
  pattern: string;
  /** Example words with that pattern, to weave in naturally. */
  patternWords: string[];
};

export type Story = { title: string; paragraphs: string[]; talkQuestion: string };

const StorySchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  talkQuestion: z.string(),
});

// Stable instructions first so the prompt prefix can be cached between children.
const BEDTIME_SYSTEM = `You write the nightly bedtime story for The Reading Routine, a 15-minute reading routine families do together. A parent reads your story aloud to their child at bedtime, after the child has read a short decodable book to the parent. This story is for enjoyment and for learning new words: it does not need to be decodable.

Write a story that:
- Stars the child by name as the hero, and includes some of the special people and pets you are given, using their names. Use the child's pronouns.
- Draws on the child's interests so it feels made for them.
- Uses each of tonight's three Spark Words at least three times, spread through the story, in exactly the spelling given (simple endings like -s, -ed, -ing are fine). The child claps each time they hear one, so make the meaning clear from what happens around the word. Do not define the words outright or mark them in any way.
- Uses any review words once each, naturally.
- Uses a handful of words with the child's current phonics pattern where they fit, without forcing it.
- Is about 950 to 1,050 words, so it fills one printed page front and back: roughly 7 to 8 minutes read aloud. Stay inside that range. Give it a real shape: a cosy start, an adventure in the middle, and a calm, sleepy ending.
- Is warm, funny and a little adventurous in the middle, then slows down: the last few paragraphs get calmer and cosier, ending with the child settling down to sleep, safe and happy. Nothing frightening, sad or violent; no peril that is not resolved warmly.
- Is right for the child's age, in plain read-aloud language, with short paragraphs (2 to 5 sentences each). Use Canadian spelling.
- Ends with one open, gentle talk question the parent can ask after reading (about the story, not a quiz on the words).

Return a title, the story as an array of paragraphs, and the talk question.`;

const CHAPTER_SYSTEM = `You write one chapter a night of an ongoing chapter book for The Reading Routine. The child has finished all 40 phonics levels and now reads the chapter aloud to their parent, so the chapter builds fluency and vocabulary.

Write a chapter that:
- Continues the book from the summary you are given (or starts a new book if there is none), starring the child by name with their special people and pets, built around their interests.
- Uses each of tonight's three Spark Words at least twice, with the meaning clear from context. Uses any review words once each.
- Is about 450 to 650 words, in short paragraphs, with varied sentence lengths that are good for reading aloud with expression, and some dialogue.
- Is engaging and kind, right for the child's age, ending on a gentle hook for tomorrow. Canadian spelling.
- Ends with one talk question that asks the child to think, predict or connect, not a recall quiz.

Return the chapter title, the paragraphs, the talk question, the book's title, and an updated running summary of the whole book so far (under 150 words) for writing tomorrow's chapter.`;

function childBrief(c: StoryChild): string {
  return JSON.stringify(
    {
      name: c.firstName,
      age: c.age,
      pronouns: c.pronouns,
      interests: c.interests,
      favouriteThings: c.favouriteThings,
      specialPeople: c.specialPeople,
      pets: c.pets,
    },
    null,
    1,
  );
}

function missingSparkWords(story: Story, words: string[], min: number): string[] {
  const text = [story.title, ...story.paragraphs].join("\n");
  return words.filter((w) => countWord(text, w) < min);
}

async function askClaude<T extends z.ZodType>(system: string, user: string, schema: T): Promise<z.infer<T>> {
  const response = await claude().beta.messages.parse({
    model: env.BEDROCK_MODEL_ID,
    max_tokens: 16000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
  });
  if (response.stop_reason === "refusal") throw new Error("The story writer declined this request.");
  if (response.stop_reason === "max_tokens") throw new Error("The story was cut off (max_tokens).");
  if (!response.parsed_output) throw new Error("The story writer returned an unreadable story.");
  return response.parsed_output as z.infer<T>;
}

export async function writeBedtimeStory(input: StoryInput): Promise<Story> {
  if (env.STORY_ENGINE === "mock") return mockStory(input);
  const words = input.sparkWords.map((w) => w.word);
  let user = `Child:\n${childBrief(input.child)}\n\nTonight's Spark Words: ${input.sparkWords
    .map((w) => `${w.word} (${w.definition})`)
    .join("; ")}\nReview words: ${input.reviewWords.join(", ") || "none"}\nPhonics pattern: ${
    input.pattern
  } (e.g. ${input.patternWords.join(", ")})`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const story = await askClaude(BEDTIME_SYSTEM, user, StorySchema);
    const missing = missingSparkWords(story, words, 3);
    if (!missing.length) return story;
    user += `\n\nYour last draft used these Spark Words fewer than three times: ${missing.join(
      ", ",
    )}. Rewrite it so every Spark Word appears at least three times.`;
  }
  throw new Error("Story did not use every Spark Word three times after two tries.");
}

const ChapterSchema = StorySchema.extend({ bookTitle: z.string(), summary: z.string() });
export type Chapter = z.infer<typeof ChapterSchema>;

export async function writeChapter(
  input: Omit<StoryInput, "pattern" | "patternWords"> & {
    book: { title: string; summary: string; chapter: number } | null;
  },
): Promise<Chapter> {
  if (env.STORY_ENGINE === "mock") {
    const s = mockStory({ ...input, pattern: "", patternWords: [] });
    return {
      ...s,
      title: `Chapter ${(input.book?.chapter ?? 0) + 1}: ${s.title}`,
      bookTitle: input.book?.title ?? `${input.child.firstName} and the Long Way Home`,
      summary: `${input.child.firstName} has been on an adventure.`,
    };
  }
  const user = `Child:\n${childBrief(input.child)}\n\nBook so far: ${
    input.book ? `"${input.book.title}", ${input.book.chapter} chapters. Summary: ${input.book.summary}` : "none yet: start a new book"
  }\nTonight's Spark Words: ${input.sparkWords.map((w) => `${w.word} (${w.definition})`).join("; ")}\nReview words: ${
    input.reviewWords.join(", ") || "none"
  }`;
  const chapter = await askClaude(CHAPTER_SYSTEM, user, ChapterSchema);
  const missing = missingSparkWords(chapter, input.sparkWords.map((w) => w.word), 2);
  if (missing.length) console.warn(`Chapter used Spark Words fewer than twice: ${missing.join(", ")}`);
  return chapter;
}

const NewWordsSchema = z.object({
  words: z.array(z.object({ word: z.string(), definition: z.string(), introTip: z.string(), interest: z.string() })),
});

/**
 * Used only when the word bank has run out for a child: asks Claude for new
 * Spark Words in the bank's style. They are saved for review and shown without
 * a picture until one is made.
 */
export async function proposeSparkWords(opts: {
  count: number;
  interests: string[];
  favouriteThings: string | null;
  age: number | null;
  avoid: string[];
}): Promise<z.infer<typeof NewWordsSchema>["words"]> {
  if (env.STORY_ENGINE === "mock") {
    return ["wonder", "sparkling", "tumble", "puzzle", "hush"]
      .filter((w) => !opts.avoid.includes(w))
      .slice(0, opts.count)
      .map((word) => ({ word, definition: `A word that means ${word}.`, introTip: `Say "${word}" together.`, interest: "" }));
  }
  const out = await askClaude(
    `You choose vocabulary words for young children's bedtime stories. Pick useful, interesting words a child will meet again in books (not rare or technical words), tied to the child's interests. For each, give a kid-friendly definition of 10 words or fewer, and one sentence telling the parent how to introduce it with a gesture, an example, or a question.`,
    `Child age: ${opts.age ?? "unknown"}. Interests: ${opts.interests.join(", ")}. Favourite things: ${
      opts.favouriteThings ?? "none given"
    }. Give ${opts.count} words. Do not use: ${opts.avoid.join(", ")}.`,
    NewWordsSchema,
  );
  return out.words.slice(0, opts.count);
}

/** Offline stand-in used in development (STORY_ENGINE=mock). */
function mockStory(input: StoryInput): Story {
  const c = input.child;
  const friend = c.specialPeople[0]?.name ?? "Grandma";
  const pet = c.pets[0] ? `${c.pets[0].name} the ${c.pets[0].kind}` : "a sleepy little owl";
  const [a, b, d] = input.sparkWords.map((w) => w.word);
  const they = c.pronouns === "she" ? "she" : c.pronouns === "he" ? "he" : "they";
  return {
    title: `${c.firstName} and the ${a ? a[0].toUpperCase() + a.slice(1) : "Starry"} Night`,
    paragraphs: [
      `Once upon a time, ${c.firstName} found a map tucked under the pillow. "Look," ${they} said to ${friend}, "it is ${a}!"`,
      `${friend} laughed. "It really is ${a}. Shall we follow it?" And ${pet} came too, of course.`,
      `The path was ${b}, and the trees whispered as they passed. Everything felt ${b} and new.`,
      `At the top of the hill they found something ${d}. ${c.firstName} had never seen anything so ${d}.`,
      `"That was ${a}," said ${friend} on the way home, "and ${b}, and very ${d}."`,
      // Filler so previews show a full-length story (the real writer aims for 950–1,050 words).
      ...Array.from(
        { length: 11 },
        (_, i) =>
          `${i % 2 ? friend : c.firstName} pointed at the next bend in the path, and ${pet} trotted ahead. The air smelled of pine and warm bread from somewhere far away, and every step felt a little more ${[a, b, d][i % 3]} than the last. They stopped to listen to the wind, counted three tiny clouds, and laughed at a squirrel who seemed to be waving.`,
      ),
      `Back in bed, ${c.firstName} snuggled down. The night was ${b} and quiet, the stars were ${d}, and the whole day had been ${a}. Soon ${they} ${they === "they" ? "were" : "was"} fast asleep.`,
    ],
    talkQuestion: `If you could follow a map anywhere tomorrow, where would you want it to take you?`,
  };
}
