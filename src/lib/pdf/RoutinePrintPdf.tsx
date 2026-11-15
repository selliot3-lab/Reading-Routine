/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt prop */
import React from "react";
import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReaderPage } from "../content";
import { INK, LINEN, SOFT, publicPath, registerFonts, withSparkWords, type RoutinePdfProps } from "./RoutinePdf";

/*
 * The print version: one sheet that folds into an 8-page little book for the
 * child, then one parent sheet (print double-sided) with the Spark Words and
 * the bedtime story.
 *
 * The little book uses the classic one-sheet fold: a landscape letter sheet
 * divided into 4 columns x 2 rows. The top row prints upside down so every
 * page is the right way up once folded.
 *
 *   top row (rotated 180°):   5 | 4 | 3 | 2
 *   bottom row:               6 | 7 | 8 | 1
 *   (1 = front cover, 8 = back cover)
 */
const SHEET_W = 792;
const SHEET_H = 612;
const PANEL_W = SHEET_W / 4;
const PANEL_H = SHEET_H / 2;
const LAYOUT: { page: number; row: 0 | 1; col: number }[] = [
  { page: 5, row: 0, col: 0 },
  { page: 4, row: 0, col: 1 },
  { page: 3, row: 0, col: 2 },
  { page: 2, row: 0, col: 3 },
  { page: 6, row: 1, col: 0 },
  { page: 7, row: 1, col: 1 },
  { page: 8, row: 1, col: 2 },
  { page: 1, row: 1, col: 3 },
];

const p = StyleSheet.create({
  sheet: { backgroundColor: "#FFFFFF", color: INK, fontFamily: "DM Sans" },
  panel: { position: "absolute", width: PANEL_W, height: PANEL_H, padding: 14, alignItems: "center" },
  readerText: { fontFamily: "Andika", textAlign: "center", lineHeight: 1.3 },
  pageNum: { position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 7, color: SOFT },
  picture: { width: PANEL_W - 28, height: 150, objectFit: "contain", marginBottom: 10 },
  pictureBox: {
    width: PANEL_W - 28,
    height: 150,
    borderWidth: 0.75,
    borderColor: "#9A9A9A",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 10,
  },
  parent: { backgroundColor: "#FFFFFF", color: INK, fontFamily: "DM Sans", fontSize: 10, lineHeight: 1.45, padding: 36, paddingBottom: 40 },
  script: { fontFamily: "Grand Hotel", lineHeight: 1.2 },
  kicker: { fontSize: 7, letterSpacing: 2, textTransform: "uppercase" },
  box: { borderWidth: 1, borderColor: INK, padding: 10 },
  small: { fontSize: 8.5, color: SOFT, lineHeight: 1.4 },
  storyP: { fontSize: 10.5, lineHeight: 1.55, marginBottom: 7 },
  btn: { borderWidth: 1, borderColor: INK, paddingVertical: 6, textDecoration: "none", color: INK, flexGrow: 1, flexBasis: 0, marginHorizontal: 3 },
  btnLabel: { textAlign: "center", fontSize: 9.5, lineHeight: 1.2 },
  footer: { position: "absolute", bottom: 16, left: 36, right: 36, fontSize: 7, color: SOFT, textAlign: "center" },
});

function bookFontSize(level: number, text: string) {
  const base = level <= 6 ? 19 : level <= 12 ? 16 : level <= 24 ? 13.5 : 11;
  return text.length > 90 ? base - 2 : base;
}

/** Fits the reader into the six inside pages of the book. */
function insidePages(pages: ReaderPage[]): ReaderPage[] {
  if (pages.length <= 6) return pages;
  const out: ReaderPage[] = [];
  const per = Math.ceil(pages.length / 6);
  for (let i = 0; i < pages.length; i += per) {
    const group = pages.slice(i, i + per);
    out.push({ text: group.map((g) => g.text).join(" "), pictureBrief: group[0].pictureBrief, picture: group[0].picture });
  }
  return out;
}

function LittleBook(props: RoutinePdfProps & { logo: string | null }) {
  const r = props.reader!;
  const inside = insidePages(r.pages);
  const panels = new Map<number, React.ReactNode>();

  panels.set(
    1,
    <View style={{ flexGrow: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: INK, width: "100%", padding: 8 }}>
      <Text style={p.kicker}>a little book</Text>
      {props.logo && <Image src={props.logo} style={{ width: 46, marginVertical: 10 }} />}
      <Text style={[p.readerText, { fontSize: 22, fontWeight: 700 }]}>{r.title}</Text>
      <Text style={[p.small, { marginTop: 14, textAlign: "center" }]}>Read by {props.childName}</Text>
      <Text style={[p.small, { textAlign: "center" }]}>Level {props.level}</Text>
    </View>,
  );

  inside.forEach((pg, i) => {
    const pic = publicPath(pg.picture);
    panels.set(
      i + 2,
      <>
        {pic ? (
          <Image src={pic} style={p.picture} />
        ) : (
          <View style={p.pictureBox}>
            <Text style={[p.small, { textAlign: "center", fontSize: 7 }]}>{pg.pictureBrief}</Text>
          </View>
        )}
        <Text style={[p.readerText, { fontSize: bookFontSize(props.level, pg.text) }]}>{pg.text}</Text>
      </>,
    );
  });

  // Fill any empty inside pages: a drawing page, then "The End".
  const firstEmpty = inside.length + 2;
  for (let n = firstEmpty; n <= 7; n++) {
    panels.set(
      n,
      n === 7 ? (
        <View style={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[p.script, { fontSize: 34 }]}>The End</Text>
          <Text style={[p.readerText, { fontSize: 12, marginTop: 8 }]}>I read it!</Text>
          <Text style={{ fontSize: 26, marginTop: 10 }}>☆ ☆ ☆</Text>
        </View>
      ) : (
        <View style={{ flexGrow: 1, width: "100%" }}>
          <Text style={[p.readerText, { fontSize: 11, marginBottom: 6 }]}>Draw your favourite part!</Text>
          <View style={{ flexGrow: 1, borderWidth: 0.75, borderColor: "#9A9A9A" }} />
        </View>
      ),
    );
  }

  panels.set(
    8,
    <View style={{ flexGrow: 1, alignItems: "center", justifyContent: "center", width: "100%" }}>
      <Text style={[p.readerText, { fontSize: 11 }]}>I read this book to</Text>
      <View style={{ borderBottomWidth: 0.75, borderColor: INK, width: "80%", height: 22 }} />
      <Text style={[p.readerText, { fontSize: 11, marginTop: 14 }]}>on</Text>
      <View style={{ borderBottomWidth: 0.75, borderColor: INK, width: "80%", height: 22 }} />
      <Text style={[p.script, { fontSize: 18, marginTop: 26 }]}>The Reading Routine</Text>
      <Text style={[p.kicker, { marginTop: 2 }]}>15 mins / day</Text>
    </View>,
  );

  return (
    <Page size={[SHEET_W, SHEET_H]} style={p.sheet}>
      {/* Fold guides: light dotted lines between panels; the cut line is dashed and marked. */}
      {[1, 2, 3].map((c) => (
        <View key={`v${c}`} style={{ position: "absolute", left: c * PANEL_W, top: 0, bottom: 0, borderLeftWidth: 0.5, borderColor: "#C9C9C9", borderStyle: "dotted" }} />
      ))}
      <View style={{ position: "absolute", top: PANEL_H, left: 0, width: PANEL_W, borderTopWidth: 0.5, borderColor: "#C9C9C9", borderStyle: "dotted" }} />
      <View style={{ position: "absolute", top: PANEL_H, left: PANEL_W * 3, width: PANEL_W, borderTopWidth: 0.5, borderColor: "#C9C9C9", borderStyle: "dotted" }} />
      <View style={{ position: "absolute", top: PANEL_H, left: PANEL_W, width: PANEL_W * 2, borderTopWidth: 1, borderColor: INK, borderStyle: "dashed" }} />
      <Text style={{ position: "absolute", top: PANEL_H + 2, left: SHEET_W / 2 - 40, width: 80, textAlign: "center", fontSize: 6.5, color: SOFT }}>
        cut along this line
      </Text>

      {LAYOUT.map(({ page, row, col }) => (
        <View
          key={page}
          style={[
            p.panel,
            { left: col * PANEL_W, top: row * PANEL_H },
            row === 0 ? { transform: "rotate(180deg)" } : {},
          ]}
        >
          {panels.get(page)}
          {page > 1 && page < 8 && <Text style={p.pageNum}>{page - 1}</Text>}
        </View>
      ))}
    </Page>
  );
}

function Feedback(props: RoutinePdfProps) {
  return (
    <View wrap={false} style={{ marginTop: 14 }}>
      <Text style={{ fontWeight: 700, textAlign: "center", marginBottom: 6 }}>How was tonight&apos;s reading for {props.childName}?</Text>
      <View style={{ flexDirection: "row" }}>
        {(
          [
            ["too_hard", "Too hard"],
            ["just_right", "Just right"],
            ["too_easy", "Too easy"],
          ] as const
        ).map(([v, label]) => (
          <Link key={v} src={props.feedbackUrl(v)} style={p.btn}>
            <Text style={p.btnLabel}>{label}</Text>
          </Link>
        ))}
      </View>
      <Text style={[p.small, { textAlign: "center", marginTop: 4 }]}>Tap a button in the email or here, or visit your account.</Text>
    </View>
  );
}

function ParentSheet(props: RoutinePdfProps & { logo: string | null }) {
  const chapter = props.mode === "chapter";
  const words = props.sparkWords.map((w) => w.word);
  return (
    <Page size="LETTER" style={p.parent}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: INK, paddingBottom: 8, marginBottom: 12 }}>
        {props.logo && <Image src={props.logo} style={{ width: 34, marginRight: 8 }} />}
        <View style={{ flexGrow: 1 }}>
          <Text style={[p.script, { fontSize: 22 }]}>The Reading Routine</Text>
          <Text style={p.kicker}>15 mins / day</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontWeight: 700 }}>Tonight with {props.childName}</Text>
          <Text style={p.small}>
            {props.dateLabel} · {chapter ? "Chapter book" : `Level ${props.level}`}
          </Text>
        </View>
      </View>

      {/* Tonight's three steps (and how to fold the little book) */}
      <View style={{ flexDirection: "row", marginBottom: 12 }} wrap={false}>
        {(chapter
          ? [
              ["1", "Spark Words", "2 min. Meet the three words below. Agree on the clap."],
              ["2", `${props.childName} reads to you`, "10–12 min. Tonight's chapter, below. Help with tricky words."],
              ["3", "Talk about it", "Ask the question at the end, then tap how it went."],
            ]
          : [
              ["1", `${props.childName} reads to you`, "5 min. The little book. Let them sound words out; wait before helping."],
              ["2", "Spark Words", "2 min. Meet the three words below, then agree on the clap signal."],
              ["3", "You read the story", "8 min. Read it aloud while they listen and clap for each Spark Word."],
            ]
        ).map(([n, title, body], i) => (
          <View key={n} style={[p.box, { flexGrow: 1, flexBasis: 0, marginLeft: i ? 6 : 0, flexDirection: "row" }]}>
            <Text style={{ fontFamily: "Bodoni", fontSize: 18, width: 18, lineHeight: 1.1 }}>{n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 700, fontSize: 9.5 }}>{title}</Text>
              <Text style={p.small}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      {!chapter && props.reader && (
        <View style={[p.box, { marginBottom: 12, backgroundColor: LINEN }]} wrap={false}>
          <Text style={{ fontWeight: 700, fontSize: 9.5, marginBottom: 2 }}>Making the little book (1 minute, no stapler)</Text>
          <Text style={p.small}>
            Print the book page single-sided. 1) Fold it in half the long way, then open it. 2) Fold it in half the short way, then
            in half again, and open it. 3) Fold it in half the short way and cut along the dashed line, from the fold to where
            the creases cross. 4) Open it, fold it the long way, and push the two ends together so the middle opens up. 5) Fold
            the pages around into a little book with the cover on the front. Tonight&apos;s sounds: {props.pattern}.
          </Text>
        </View>
      )}

      {/* Spark Words */}
      <View wrap={false} style={{ marginBottom: 12 }}>
        <Text style={[p.script, { fontSize: 22 }]}>Tonight&apos;s Spark Words</Text>
        <Text style={[p.small, { marginBottom: 6 }]}>
          Read each word, what it means and the little activity. Then tell {props.childName}: &quot;Listen for these words in the
          story. When you hear one, clap!&quot;
        </Text>
        <View style={{ flexDirection: "row" }}>
          {props.sparkWords.map((w, i) => {
            const pic = publicPath(w.picture);
            return (
              <View key={w.word} style={[p.box, { flexGrow: 1, flexBasis: 0, marginLeft: i ? 6 : 0 }]}>
                {pic && <Image src={pic} style={{ height: 60, objectFit: "contain", marginBottom: 4 }} />}
                <Text style={[p.script, { fontSize: 22 }]}>{w.word}</Text>
                <Text style={{ fontWeight: 700, fontSize: 9.5 }}>{w.definition}</Text>
                <Text style={p.small}>{w.introTip}</Text>
              </View>
            );
          })}
        </View>
        {props.reviewWords.length > 0 && (
          <Text style={[p.small, { marginTop: 5 }]}>
            Bonus: listen for {props.reviewWords.map((w) => `"${w}"`).join(" and ")} from a few weeks ago. A double clap if they
            remember what it means!
          </Text>
        )}
      </View>

      {/* The story (or tonight's chapter) */}
      <Text style={p.kicker}>{chapter ? `${props.childName} reads tonight's chapter` : "You read · they listen and clap"}</Text>
      <Text style={[p.script, { fontSize: 26, marginBottom: 6 }]}>{props.story.title}</Text>
      {props.story.paragraphs.map((para, i) => (
        <Text key={i} style={[p.storyP, chapter ? { fontFamily: "Andika", fontSize: 12.5 } : {}]}>
          {withSparkWords(para, words)}
        </Text>
      ))}
      <View style={[p.box, { marginTop: 6 }]} wrap={false}>
        <Text style={{ fontWeight: 700 }}>Talk about it</Text>
        <Text>{props.story.talkQuestion}</Text>
      </View>

      {props.check && (
        <View style={[p.box, { marginTop: 12 }]} wrap={false}>
          <Text style={{ fontWeight: 700 }}>It&apos;s check night! Can {props.childName} read these words?</Text>
          <Text style={[{ fontFamily: "Andika", fontSize: 15, marginVertical: 6, lineHeight: 1.5 }]}>{props.check.words.join("    ")}</Text>
          <Text style={[{ fontFamily: "Andika", fontSize: 12 }]}>{props.check.passage}</Text>
          <Link src={props.check.url} style={[p.btn, { marginTop: 8, marginHorizontal: 0 }]}>
            <Text style={p.btnLabel}>Record tonight&apos;s check (20 seconds)</Text>
          </Link>
        </View>
      )}

      <Feedback {...props} />
      <Text style={p.footer} fixed render={({ pageNumber }) => `The Reading Routine · ${props.childName} · ${props.dateLabel}${pageNumber > 1 ? " · continued" : ""}`} />
    </Page>
  );
}

export function RoutinePrintPdf(props: RoutinePdfProps) {
  registerFonts();
  const logo = publicPath("/brand/clock-180.png");
  return (
    <Document title={`${props.childName}'s Reading Routine — ${props.dateLabel} (print)`} author="The Reading Routine">
      {props.mode !== "chapter" && props.reader && <LittleBook {...props} logo={logo} />}
      <ParentSheet {...props} logo={logo} />
    </Document>
  );
}
