/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt prop */
import path from "node:path";
import { existsSync } from "node:fs";
import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ColourSheet, Reader } from "../content";
import { ColourSheetPage } from "./ColourSheet";
import type { RoutineSparkWord, RoutineStory } from "../db/schema";
import { ActivityPage, LetterCover } from "./ActivityPage";

const fontDir = path.join(process.cwd(), "assets", "fonts");
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({
    family: "Andika",
    fonts: [
      { src: path.join(fontDir, "andika-latin-400-normal.woff") },
      { src: path.join(fontDir, "andika-latin-700-normal.woff"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "DM Sans",
    fonts: [
      { src: path.join(fontDir, "dm-sans-latin-400-normal.woff") },
      { src: path.join(fontDir, "dm-sans-latin-700-normal.woff"), fontWeight: 700 },
    ],
  });
  Font.register({ family: "Grand Hotel", src: path.join(fontDir, "grand-hotel-latin-400-normal.woff") });
  Font.register({ family: "Bodoni", src: path.join(fontDir, "bodoni-moda-latin-500-normal.woff") });
  Font.registerHyphenationCallback((w) => [w]); // never hyphenate words for early readers
  fontsReady = true;
}

const INK = "#161616";
const LINEN = "#F6F3EC";
const CABANA = "#D8DDE7";
const SOFT = "#5B5B5B";

const s = StyleSheet.create({
  page: { backgroundColor: LINEN, color: INK, fontFamily: "DM Sans", fontSize: 10.5, padding: 30, lineHeight: 1.45 },
  frame: { flexGrow: 1, borderWidth: 1, borderColor: INK, padding: 20, backgroundColor: LINEN },
  stripes: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" },
  stripe: { flexGrow: 1 },
  kicker: { fontSize: 7.5, letterSpacing: 2.2, textTransform: "uppercase", textAlign: "center" },
  script: { fontFamily: "Grand Hotel", fontSize: 30, lineHeight: 1.25, textAlign: "center", marginVertical: 6 },
  h2: { fontFamily: "Grand Hotel", fontSize: 24, lineHeight: 1.25, marginBottom: 6 },
  small: { fontSize: 8.5, color: SOFT },
  step: { flexDirection: "row", marginBottom: 8 },
  stepNum: { fontFamily: "Bodoni", fontSize: 16, lineHeight: 1.2, width: 22 },
  readerText: { fontFamily: "Andika", textAlign: "center", lineHeight: 1.35 },
  pictureBox: { borderWidth: 1, borderColor: INK, borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 10, marginBottom: 14 },
  card: { borderWidth: 1, borderColor: INK, padding: 10, marginBottom: 10, flexDirection: "row" },
  sparkWord: { fontFamily: "Grand Hotel", fontSize: 26, lineHeight: 1.2, marginBottom: 2 },
  storyP: { fontSize: 11.5, marginBottom: 8, lineHeight: 1.55 },
  feedbackBtn: { borderWidth: 1, borderColor: INK, paddingVertical: 8, paddingHorizontal: 10, color: INK, textDecoration: "none", flexGrow: 1, flexBasis: 0, marginHorizontal: 3 },
  feedbackLabel: { textAlign: "center", fontSize: 10, lineHeight: 1.2 },
  footer: { position: "absolute", bottom: 12, left: 30, right: 30, fontSize: 7, color: SOFT, textAlign: "center" },
});

export type RoutinePdfProps = {
  childName: string;
  dateLabel: string;
  level: number;
  mode: "standard" | "chapter";
  pattern: string;
  heartWords: string[];
  reader: Reader | null;
  /** One-minute sound warm-up before the little book. */
  warmUp: { mode: "robot" | "quick"; words: string[][] } | null;
  /** Heart words in tonight's book, shown on its cover for review. */
  bookHeartWords: string[];
  /** On pre-reading nights: the colour-by-heart-word sheet. */
  colourSheet: ColourSheet | null;
  sparkWords: RoutineSparkWord[];
  reviewWords: string[];
  story: RoutineStory;
  check: { words: string[]; passage: string; url: string } | null;
  feedbackUrl: (v: "too_hard" | "just_right" | "too_easy") => string;
  accountUrl: string;
};

const publicPath = (p: string | null) => {
  if (!p) return null;
  const full = path.join(process.cwd(), "public", p.replace(/^\//, ""));
  return existsSync(full) ? full : null;
};

function Stripes() {
  return (
    <View style={s.stripes} fixed>
      {Array.from({ length: 13 }, (_, i) => (
        <View key={i} style={[s.stripe, { backgroundColor: i % 2 ? CABANA : LINEN }]} />
      ))}
    </View>
  );
}

function Footer({ childName }: { childName: string }) {
  return (
    <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `The Reading Routine · ${childName} · ${pageNumber} / ${totalPages}`} />
  );
}

/** Size reader text so early levels get very large print. */
function readerFontSize(level: number, text: string) {
  const base = level <= 6 ? 30 : level <= 12 ? 26 : level <= 24 ? 21 : 17;
  return text.length > 120 ? base - 4 : base;
}

/** Bolds Spark Words in the story so the parent can pause for the clap. */
function withSparkWords(paragraph: string, words: string[]) {
  if (!words.length) return paragraph;
  const re = new RegExp(`\\b(${words.map((w) => w.replace(/e$/, "")).join("|")})[a-z]*\\b`, "gi");
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of paragraph.matchAll(re)) {
    out.push(paragraph.slice(last, m.index));
    out.push(
      <Text key={m.index} style={{ fontWeight: 700, textDecoration: "underline" }}>
        {m[0]}
      </Text>,
    );
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(paragraph.slice(last));
  return out;
}

export function RoutinePdf(p: RoutinePdfProps) {
  registerFonts();
  const logo = publicPath("/brand/clock-180.png");
  const chapter = p.mode === "chapter";
  return (
    <Document title={`${p.childName}'s Reading Routine — ${p.dateLabel}`} author="The Reading Routine">
      {/* Cover: tonight at a glance */}
      <Page size={[396, 612]} style={s.page}>
        <Stripes />
        <View style={s.frame}>
          <Text style={s.kicker}>15 mins / day</Text>
          {logo && <Image src={logo} style={{ width: 70, alignSelf: "center", marginTop: 10 }} />}
          <Text style={s.script}>The Reading Routine</Text>
          <Text style={{ textAlign: "center", fontSize: 12, marginBottom: 2 }}>
            Tonight with {p.childName} · {p.dateLabel}
          </Text>
          <Text style={[s.small, { textAlign: "center", marginBottom: 16 }]}>
            {chapter ? "Chapter book" : `Level ${p.level} · ${p.pattern}`}
          </Text>
          {(chapter
            ? [
                ["Spark Words", "2 min. Read the three words and their meanings together. Agree on the clap."],
                [`${p.childName} reads to you`, "10–12 min. Tonight's chapter. Help with tricky words, then ask the talk question."],
                ["Tell us how it went", "Tap too hard, just right or too easy in tonight\u2019s email."],
              ]
            : [
                ["Sound warm-up", p.warmUp?.mode === "robot"
                  ? `1 min. Robot talk: ${p.warmUp.words.map((x) => x.join("-")).join(", ")}. They blend the sounds into a word.`
                  : `1 min. Quick read: ${p.warmUp?.words.map((x) => x[0]).join(", ") ?? ""}.`],
                p.reader?.type === "sound"
                  ? ["Sound book, together", "5 min. A quick game on every page. The small grey words tell you what to do."]
                  : p.reader?.type === "heart"
                    ? ["Heart words, together", "5 min. The heart word book, then the colour-by-heart-word sheet."]
                    : [`${p.childName} reads to you`, "5 min. The little book, three ways: they sound it out, you read it together, they read it alone."],
                ["Spark Words", "2 min. Meet three new words, then agree on the clap signal."],
                ["You read the bedtime story", "8 min. Read aloud while they listen and clap for each Spark Word."],
                ["Tell us how it went", "Tap too hard, just right or too easy in tonight\u2019s email."],
              ]
          ).map(([title, body], i) => (
            <View key={title} style={s.step}>
              <Text style={s.stepNum}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 700 }}>{title}</Text>
                <Text style={s.small}>{body}</Text>
              </View>
            </View>
          ))}
          {!chapter && p.heartWords.length > 0 && (
            <View style={{ marginTop: "auto", borderTopWidth: 1, borderColor: INK, paddingTop: 8 }}>
              <Text style={{ fontWeight: 700, fontSize: 9 }}>Parent tip: tonight&apos;s sounds</Text>
              <Text style={s.small}>
                {p.childName} is practising {p.pattern}. Heart words they know by heart: {p.heartWords.join(", ")}. If they get stuck on
                a word, point to each letter and say the sounds together, then blend.
              </Text>
            </View>
          )}
        </View>
        <Footer childName={p.childName} />
      </Page>

      {/* Part 1: the decodable reader, one page per spread so it flips like a little book */}
      {!chapter && p.reader && (
        <>
          <Page size={[396, 612]} style={s.page}>
            <View style={[s.frame, { justifyContent: "center", alignItems: "center" }]}>
              <Text style={s.kicker}>
                {p.reader.type === "sound" ? "Tonight's sound book: do it together" : p.reader.type === "heart" ? "Tonight's heart words: do it together" : `${p.childName} reads to you`}
              </Text>
              {p.reader.cover ? (
                <View style={{ marginTop: 16 }}>
                  <LetterCover cover={p.reader.cover} say={p.reader.say} width={300} s={1.6} />
                </View>
              ) : (
                <Text style={[s.readerText, { fontSize: 34, fontWeight: 700, marginTop: 20 }]}>{p.reader.title}</Text>
              )}
              {p.bookHeartWords.length > 0 && (
                <View style={{ marginTop: 20, alignItems: "center" }}>
                  <Text style={s.kicker}>heart words in this book</Text>
                  <Text style={[s.readerText, { fontSize: 20, marginTop: 4 }]}>{p.bookHeartWords.join("   ")}</Text>
                </View>
              )}
              <Text style={[s.small, { marginTop: 24, textAlign: "center" }]}>
                {p.bookHeartWords.length > 0 ? `Practise the heart words first. Then let ${p.childName} read the title and turn the page.` : `Let ${p.childName} read the title, then turn the page.`}
              </Text>
            </View>
            <Footer childName={p.childName} />
          </Page>
          {p.reader.pages.map((pg, i) => {
            if (pg.kind) {
              return (
                <Page key={i} size={[396, 612]} style={s.page}>
                  <View style={[s.frame, { alignItems: "center" }]}>
                    <ActivityPage page={pg} width={300} s={1.75} />
                  </View>
                  <Footer childName={p.childName} />
                </Page>
              );
            }
            const pic = publicPath(pg.picture);
            return (
              <Page key={i} size={[396, 612]} style={s.page}>
                <View style={s.frame}>
                  {pic ? (
                    <Image src={pic} style={{ height: 300, objectFit: "contain", marginBottom: 18 }} />
                  ) : (
                    <View style={[s.pictureBox, { height: 300 }]}>
                      {logo && <Image src={logo} style={{ width: 40, opacity: 0.25, marginBottom: 8 }} />}
                      <Text style={[s.small, { textAlign: "center" }]}>Picture: {pg.pictureBrief}</Text>
                    </View>
                  )}
                  <Text style={[s.readerText, { fontSize: readerFontSize(p.level, pg.text) }]}>{pg.text}</Text>
                </View>
                <Footer childName={p.childName} />
              </Page>
            );
          })}
        </>
      )}

      {p.colourSheet && <ColourSheetPage sheet={p.colourSheet} childName={p.childName} level={p.level} size={[396, 612]} />}

      {/* Weekly check */}
      {p.check && (
        <Page size={[396, 612]} style={s.page}>
          <View style={s.frame}>
            <Text style={s.kicker}>Weekly check</Text>
            <Text style={[s.h2, { textAlign: "center" }]}>Can {p.childName} read these?</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 8 }}>
              {p.check.words.map((w) => (
                <Text key={w} style={[s.readerText, { fontSize: 22, width: "50%", marginBottom: 8 }]}>
                  {w}
                </Text>
              ))}
            </View>
            <Text style={[s.readerText, { fontSize: 15, marginTop: 6 }]}>{p.check.passage}</Text>
            <Text style={[s.small, { marginTop: "auto", textAlign: "center" }]}>
              Count the words read correctly, and notice how smoothly they read the passage. Then record it from the link in
              tonight&apos;s email (takes 20 seconds).
            </Text>
          </View>
          <Footer childName={p.childName} />
        </Page>
      )}

      {/* Part 2: Spark Words */}
      <Page size={[396, 612]} style={s.page}>
        <View style={s.frame}>
          <Text style={s.kicker}>Before the story</Text>
          <Text style={[s.h2, { textAlign: "center" }]}>Tonight&apos;s Spark Words</Text>
          <Text style={[s.small, { marginBottom: 10 }]}>
            Read each word and what it means, and try the little activity. Then tell {p.childName}: &quot;Listen for these Spark Words in
            the story. When you hear one, clap!&quot;
          </Text>
          {p.sparkWords.map((w) => {
            const pic = publicPath(w.picture);
            return (
              <View key={w.word} style={[s.card, { flexDirection: "column", alignItems: "center" }]} wrap={false}>
                {pic && <Image src={pic} style={{ width: "100%", height: 70, objectFit: "contain", marginBottom: 4 }} />}
                {/* In clear print, so the child can see and read the word. */}
                <Text style={{ fontFamily: "Andika", fontWeight: 700, fontSize: 22, lineHeight: 1.35, marginBottom: 3 }}>{w.word}</Text>
                <Text style={{ fontWeight: 700, fontSize: 10.5, textAlign: "center" }}>{w.definition}</Text>
                <Text style={[s.small, { textAlign: "center" }]}>{w.introTip}</Text>
              </View>
            );
          })}
          {p.reviewWords.length > 0 && (
            <Text style={[s.small, { marginTop: 4 }]}>
              Bonus: listen for {p.reviewWords.map((w) => `"${w}"`).join(" and ")} from a few weeks ago. A double clap if they
              remember what it means!
            </Text>
          )}
          <Text style={[s.small, { marginTop: "auto", fontSize: 7.5 }]}>
            Why this works: children learn a new word after meeting it many times. Hearing the meaning first gives them a hook to
            hang it on, and every time they hear it in a story, that memory gets stronger.
          </Text>
        </View>
        <Footer childName={p.childName} />
      </Page>

      {/* Part 3: the story (parent reads) or tonight's chapter (child reads) */}
      <Page size={[396, 612]} style={s.page}>
        <Text style={s.kicker}>{chapter ? `${p.childName} reads tonight's chapter` : "You read · they listen and clap"}</Text>
        <Text style={[s.h2, { textAlign: "center", marginTop: 4 }]}>{p.story.title}</Text>
        {p.story.beforeQuestion && (
          <Text style={s.storyP}>
            <Text style={{ fontWeight: 700 }}>Before you read: </Text>
            {p.story.beforeQuestion}
          </Text>
        )}
        {p.story.paragraphs.map((para, i) => (
          <Text key={i} style={[s.storyP, chapter ? { fontFamily: "Andika", fontSize: 13 } : {}]}>
            {withSparkWords(para, p.sparkWords.map((w) => w.word))}
          </Text>
        ))}
        <View style={{ borderTopWidth: 1, borderColor: INK, paddingTop: 8, marginTop: 6 }} wrap={false}>
          <Text style={{ fontWeight: 700 }}>Talk about it</Text>
          <Text>{p.story.talkQuestion}</Text>
          <Text style={[s.small, { marginTop: 3 }]}>
            Wait a few seconds for an answer. If it is short, ask &quot;What makes you think that?&quot; Praise the thinking, not just the answer.
          </Text>
        </View>
        <Text style={[s.small, { textAlign: "center", marginTop: 14 }]}>Sweet dreams. See you tomorrow.</Text>
        <Footer childName={p.childName} />
      </Page>
    </Document>
  );
}

export { registerFonts, s as styles, publicPath, withSparkWords, INK, LINEN, CABANA, SOFT };
