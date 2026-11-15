import storiesData from "../../../content/stories.json";
import { SPARK_WORDS } from "../content";
import { countWord } from "./sparkWords";
import type { Pet, SpecialPerson } from "../db/schema";

/**
 * The prewritten bedtime story library. Stories are written once, read and
 * approved by the founder, and personalized on our own server by filling in
 * the child's name, pronouns, special person and pet. No child data is sent
 * anywhere to write a story.
 */
export type StoryTemplate = {
  id: string;
  interest: string;
  approved: boolean;
  title: string;
  sparkWords: string[];
  beforeQuestion: string;
  talkQuestion: string;
  paragraphs: string[];
};

export const STORIES: StoryTemplate[] = storiesData.stories as StoryTemplate[];

export type StoryReader = {
  firstName: string;
  pronouns: string;
  specialPeople: SpecialPerson[];
  pets: Pet[];
};

/** Used when a family hasn't named a special person: a kind neighbour who can appear in any story. */
export const FALLBACK_PERSON = "Mrs. Maple";

const PRONOUNS: Record<string, Record<string, string>> = {
  she: { they: "she", them: "her", their: "her", theirs: "hers", themself: "herself" },
  he: { they: "he", them: "him", their: "his", theirs: "his", themself: "himself" },
  they: { they: "they", them: "them", their: "their", theirs: "theirs", themself: "themself" },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Fills one piece of template text for a child. */
export function fill(text: string, c: StoryReader): string {
  const set = PRONOUNS[c.pronouns] ?? PRONOUNS.they;
  const plural = set === PRONOUNS.they;
  const person = c.specialPeople[0]?.name?.trim() || FALLBACK_PERSON;
  const person2 = c.specialPeople[1]?.name?.trim() || person;
  const pet = c.pets[0];
  const values: Record<string, string> = {
    name: c.firstName,
    person,
    person2,
    pet: pet?.name ?? "",
    pet_kind: pet?.kind?.toLowerCase() ?? "",
    ...set,
  };
  return text
    .replace(/\[([^|\]]+)\|([^\]]+)\]/g, (_, singular: string, theyForm: string) => (plural ? theyForm : singular))
    .replace(/\{(\w+)\}/g, (m, key: string) => {
      const lower = key.toLowerCase();
      const v = values[lower];
      if (v === undefined) return m;
      return key[0] === key[0].toUpperCase() && key[0] !== key[0].toLowerCase() ? cap(v) : v;
    });
}

export type FilledStory = {
  storyId: string;
  title: string;
  paragraphs: string[];
  beforeQuestion: string;
  talkQuestion: string;
};

export function personalize(t: StoryTemplate, c: StoryReader): FilledStory {
  const hasPet = c.pets.length > 0 && Boolean(c.pets[0].name?.trim());
  const paragraphs = t.paragraphs
    .filter((p) => hasPet || !p.startsWith("[pet]"))
    .map((p) => fill(p.replace(/^\[pet\]\s*/, ""), c));
  return {
    storyId: t.id,
    title: fill(t.title, c),
    paragraphs,
    beforeQuestion: fill(t.beforeQuestion, c),
    talkQuestion: fill(t.talkQuestion, c),
  };
}

/**
 * Picks tonight's story: one the child hasn't heard, from their interests
 * first, preferring stories whose Spark Words they haven't met. Only approved
 * stories are used, unless `allowDrafts` (development and previews).
 */
export function pickStory(opts: {
  interests: string[];
  heard: Set<string>;
  metWords: Set<string>;
  allowDrafts?: boolean;
}): StoryTemplate | null {
  const pool = STORIES.filter((s) => s.approved || opts.allowDrafts);
  const fresh = pool.filter((s) => !opts.heard.has(s.id));
  const score = (s: StoryTemplate) =>
    (opts.interests.includes(s.interest) ? 10 : 0) + s.sparkWords.filter((w) => !opts.metWords.has(w.toLowerCase())).length;
  const ranked = (fresh.length ? fresh : pool).slice().sort((a, b) => score(b) - score(a));
  return ranked[0] ?? null;
}

/** Problems with a story template: unknown placeholders, missing Spark Words, length. */
export function checkStory(t: StoryTemplate): string[] {
  const issues: string[] = [];
  const known = new Set(["name", "they", "them", "their", "theirs", "themself", "person", "person2", "pet", "pet_kind"]);
  const all = [t.title, t.beforeQuestion, t.talkQuestion, ...t.paragraphs].join("\n");
  for (const m of all.matchAll(/\{(\w+)\}/g)) if (!known.has(m[1].toLowerCase())) issues.push(`unknown placeholder {${m[1]}}`);
  for (const p of t.paragraphs) if (!p.startsWith("[pet]") && /\{pet(_kind)?\}/.test(p)) issues.push(`{pet} outside a [pet] paragraph: "${p.slice(0, 40)}…"`);
  for (const w of t.sparkWords) {
    if (!SPARK_WORDS.some((s) => s.word === w)) issues.push(`Spark Word "${w}" is not in the bank`);
    const n = countWord(t.paragraphs.join(" "), w);
    if (n < 3) issues.push(`Spark Word "${w}" used ${n} times (needs 3)`);
  }
  // Length for a family with a pet and without one.
  for (const pets of [[{ name: "Biscuit", kind: "dog" }], []]) {
    const words = personalize(t, { firstName: "Maya", pronouns: "they", specialPeople: [{ name: "Nana", relation: "grandma" }], pets })
      .paragraphs.join(" ")
      .split(/\s+/).length;
    if (words < 900 || words > 1040) issues.push(`${words} words ${pets.length ? "with" : "without"} a pet (aim for 900-1,040 so it fits one sheet)`);
  }
  return [...new Set(issues)];
}
