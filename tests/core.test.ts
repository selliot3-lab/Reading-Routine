import { describe, expect, it } from "vitest";
import { isClosedSyllableDecodable, placeFromResults, undecodableWords } from "../src/lib/curriculum";
import { auditReaders } from "../src/lib/content";
import { decide, nextLevel } from "../src/lib/progression";
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
});

describe("placement", () => {
  it("places at the last group passed", () => {
    const ok = [true, true, true, true, true];
    expect(placeFromResults({ 1: ok, 6: ok, 12: [false, false] })).toBe(6);
    expect(placeFromResults({ 1: [false, false] })).toBe(1);
    expect(placeFromResults({ 1: ok, 6: ok, 12: ok, 18: ok, 24: ok, 30: ok, 36: ok })).toBe(36);
  });
});

describe("weekly check", () => {
  it("moves up at 9/10, stays at 7-8, steps back at 6", () => {
    expect(decide(10, 9, 10, null)).toBe("up");
    expect(decide(10, 8, 10, null)).toBe("stay");
    expect(decide(10, 6, 10, null)).toBe("back");
    expect(decide(1, 6, 6, null)).toBe("up");
  });
  it("needs fluency 2+ in Stage 3", () => {
    expect(decide(30, 10, 10, 1)).toBe("stay");
    expect(decide(30, 10, 10, 2)).toBe("up");
  });
  it("graduates after Level 40", () => {
    expect(nextLevel(40, "up")).toBe(41);
    expect(nextLevel(1, "back")).toBe(1);
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
