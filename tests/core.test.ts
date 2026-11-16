import { describe, expect, it } from "vitest";
import { isClosedSyllableDecodable, placeFromResults, undecodableWords } from "../src/lib/curriculum";
import { auditReaders, colourSheetFor, heartWordsIn, READERS, TEACHING, teachingBooksFor } from "../src/lib/content";
import { isDecodable } from "../src/lib/decoder";
import { nextLevel, readyToMoveUp } from "../src/lib/progression";
import { countWord, pickReviewWords, pickSparkWords } from "../src/lib/story/sparkWords";

describe("decodability", () => {
  it("accepts words made of taught letters only", () => {
    expect(isClosedSyllableDecodable("mat", 1)).toBe(true);
    expect(isClosedSyllableDecodable("map", 1)).toBe(false); // p is Level 2
    expect(isClosedSyllableDecodable("past", 9)).toBe(false); // blends start at Level 10
    expect(isClosedSyllableDecodable("past", 10)).toBe(true);
    expect(isClosedSyllableDecodable("shelf", 14)).toBe(true);
  });
  it("flags patterns not taught yet", () => {
    expect(undecodableWords("The cat sat. I see a cat.", 5)).toEqual(["see"]);
    expect(undecodableWords("Tim naps.", 2)).toEqual(["naps"]); // -s plurals at Level 6
  });
  it("every library reader passes", () => {
    expect(auditReaders()).toEqual([]);
  });
  it("every book has exactly 6 pages for the fold-up little book", () => {
    expect(READERS.filter((r) => r.pages.length !== 6).map((r) => r.id)).toEqual([]);
  });
});

describe("placement", () => {
  it("places at the last group passed", () => {
    const ok = [true, true, true, true, true];
    expect(placeFromResults({ 1: ok, 6: ok, 12: [false, false] })).toBe(6);
    expect(placeFromResults({ 1: [false, false] })).toBe(1);
    expect(placeFromResults({ 1: ok, 6: ok, 12: ok, 18: ok, 24: ok, 30: ok, 36: ok })).toBe(36);
  });
});

describe("moving up a level", () => {
  it("moves up after two weeks unless the last nights were too hard", () => {
    expect(readyToMoveUp(13, [null, null, null])).toBe(false);
    expect(readyToMoveUp(14, ["just_right", null, "too_easy"])).toBe(true);
    expect(readyToMoveUp(14, ["too_hard", "just_right", null])).toBe(false);
  });
  it("moves up early after three too-easy nights", () => {
    expect(readyToMoveUp(4, ["too_easy", "too_easy", "too_easy"])).toBe(true);
  });
  it("graduates after Level 40", () => {
    expect(nextLevel(40)).toBe(41);
  });
});

describe("Spark Words", () => {
  it("picks three new words matching interests, never repeating", () => {
    const words = pickSparkWords({ interests: ["dinosaurs", "ocean"], alreadyMet: new Set(["enormous"]), seed: "x" });
    expect(words).toHaveLength(3);
    expect(words.map((w) => w.word)).not.toContain("enormous");
    expect(words.some((w) => w.interests.includes("dinosaurs"))).toBe(true);
  });
  it("brings words back after 2 and 4 weeks", () => {
    const h = [
      { word: "a", firstSeen: "2026-11-01" },
      { word: "b", firstSeen: "2026-10-18" },
      { word: "c", firstSeen: "2026-11-10" },
    ];
    expect(pickReviewWords(h, "2026-11-15")).toEqual(["a", "b"]);
  });
  it("counts word forms", () => {
    expect(countWord("She stomped. Stomp! stomping", "stomp")).toBe(3);
    expect(countWord("a gentle pat, gently", "gentle")).toBe(2);
  });
});

describe("teaching books and heart words", () => {
  it("opens every level with its sound books, then a heart-word book", () => {
    for (let level = 1; level <= 40; level++) {
      const books = teachingBooksFor(level);
      expect(books.at(-1)?.type, `Level ${level}`).toBe("heart");
      for (const b of books) expect(b.pages.length, b.id).toBe(6);
    }
    expect(teachingBooksFor(1).map((b) => b.title)).toEqual(["My Aa Book", "My Mm Book", "My Ss Book", "My Tt Book", "My Level 1 Heart Words"]);
    expect(TEACHING.filter((b) => b.type === "sound").length).toBeGreaterThan(60);
  });
  it("has story readers for every level", () => {
    for (let level = 1; level <= 40; level++) expect(READERS.some((r) => r.level === level), `Level ${level}`).toBe(true);
  });
  it("lists a book's heart words for its cover", () => {
    const pot = READERS.find((r) => r.id === "L03-the-pot")!;
    expect(heartWordsIn(pot)).toEqual(["the", "is", "and"]);
  });
  it("builds a colour-by-heart-word sheet with every word hidden in the sea", () => {
    const sheet = colourSheetFor(1)!;
    expect(sheet.words.map((w) => w.word)).toEqual(["the", "a", "I"]);
    expect(sheet.sea).toHaveLength(48);
    for (const { word } of sheet.words) expect(sheet.sea).toContain(word);
  });
});

describe("sound warm-up", () => {
  it("splits words into taught sounds for robot talk", async () => {
    const { segmentWord } = await import("../src/lib/curriculum");
    expect(segmentWord("shop", 14)).toEqual(["sh", "o", "p"]);
    expect(segmentWord("mat", 1)).toEqual(["m", "a", "t"]);
    expect(segmentWord("ship", 3)).toBeNull();
  });
  it("uses robot talk to Level 17 and quick words above", async () => {
    const { warmUpFor } = await import("../src/lib/curriculum");
    expect(warmUpFor(1, "2026-11-16").mode).toBe("robot");
    expect(warmUpFor(1, "2026-11-16").words).toHaveLength(3);
    expect(warmUpFor(30, "2026-11-16").mode).toBe("quick");
  });
});

describe("decoder", () => {
  it("follows the scope and sequence", () => {
    expect(isDecodable("mat", 1)).toBe(true);
    expect(isDecodable("back", 13)).toBe(false); // ck at 14
    expect(isDecodable("back", 14)).toBe(true);
    expect(isDecodable("cake", 17)).toBe(false); // silent e at 18
    expect(isDecodable("cake", 18)).toBe(true);
    expect(isDecodable("car", 24)).toBe(false); // ar at 25
    expect(isDecodable("rain", 27)).toBe(true);
    expect(isDecodable("sunset", 21)).toBe(false); // two syllables at 22
    expect(isDecodable("sunset", 22)).toBe(true);
    expect(isDecodable("jumped", 21)).toBe(true);
    expect(isDecodable("hopping", 21)).toBe(false);
    expect(isDecodable("kiss", 12)).toBe(false); // ss at 13
    expect(isDecodable("helpful", 36)).toBe(true);
  });
});

describe("prewritten story library", async () => {
  const { STORIES, personalize, pickStory, checkStory, fill } = await import("../src/lib/story/library");
  const kid = { firstName: "Maya", pronouns: "they", specialPeople: [{ name: "Nana", relation: "grandma" }], pets: [] };
  it("fills names, pronouns and verbs", () => {
    expect(fill("{They} [was|were] with {person}. {name} hugged {them}.", kid)).toBe("They were with Nana. Maya hugged them.");
    expect(fill("{They} [was|were] sleepy.", { ...kid, pronouns: "she" })).toBe("She was sleepy.");
    expect(fill("{person} waved.", { ...kid, specialPeople: [] })).toBe("Mrs. Maple waved.");
  });
  it("leaves out pet paragraphs for children without a pet", () => {
    const withPet = personalize(STORIES[0], { ...kid, pets: [{ name: "Biscuit", kind: "dog" }] });
    const without = personalize(STORIES[0], kid);
    expect(withPet.paragraphs.length).toBeGreaterThan(without.paragraphs.length);
    expect(without.paragraphs.join(" ")).not.toMatch(/\{|\}|\[|\]/);
  });
  it("passes its checks and never repeats a story", () => {
    for (const s of STORIES) expect(checkStory(s), s.id).toEqual([]);
    const first = pickStory({ interests: ["space"], heard: new Set(), metWords: new Set(), allowDrafts: true })!;
    expect(first.interest).toBe("space");
    const second = pickStory({ interests: ["space"], heard: new Set([first.id]), metWords: new Set(), allowDrafts: true })!;
    expect(second.id).not.toBe(first.id);
    expect(pickStory({ interests: ["space"], heard: new Set(), metWords: new Set() })).toBeNull(); // drafts aren't served
  });
});

describe("heart word fronts", () => {
  it("marks every heart word, with parts that spell the word", async () => {
    const { HEART_MARKS, markedParts } = await import("../src/lib/heartMarks");
    const { LEVELS } = await import("../src/lib/curriculum");
    for (const l of LEVELS) for (const w of l.heartWords) {
      const word = w.toLowerCase();
      const parts = markedParts(word);
      expect(parts, `marks for ${word}`).not.toBeNull();
      expect(parts!.map(([t]) => t).join(""), word).toBe(word);
    }
    expect(Object.keys(HEART_MARKS).length).toBeGreaterThan(90);
  });
});
