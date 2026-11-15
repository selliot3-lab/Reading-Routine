/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt prop */
import React from "react";
import { Document, Image, Page, Polygon, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ReaderPage } from "../content";
import { INK, LINEN, SOFT, publicPath, registerFonts, withSparkWords, type RoutinePdfProps } from "./RoutinePdf";
import { ColourSheetPage } from "./ColourSheet";

/*
 * The print version: one sheet that folds into an 8-page little book for the
 * child, then the parent sheet (one sheet, printed front and back) with the
 * Spark Words and the bedtime story. Feedback buttons live in the email only.
 *
 * The little book uses the classic one-sheet fold: a landscape letter sheet
 * divided into 4 columns x 2 rows. The top row prints upside down so every
 * page is the right way up once folded.
 *
 *   top row (rotated 180°):   5 | 4 | 3 | 2
 *   bottom row:               6 | 7 | 8 | 1
 *   (1 = front cover, 2–7 = the six story pages, 8 = back cover)
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

/** Past this many characters a page's words need the room, so the picture shrinks, then goes. */
const SHRINK_PICTURE_AT = 70;
const DROP_PICTURE_AT = 150;

const p = StyleSheet.create({
  sheet: { backgroundColor: "#FFFFFF", color: INK, fontFamily: "DM Sans" },
  panel: { position: "absolute", width: PANEL_W, height: PANEL_H, padding: 14, alignItems: "center" },
  readerText: { fontFamily: "Andika", textAlign: "center", lineHeight: 1.3 },
  pageNum: { position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 7, color: SOFT },
  pictureBox: {
    width: PANEL_W - 28,
    borderWidth: 0.75,
    borderColor: "#B5B5B5",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginBottom: 10,
  },
  parent: { backgroundColor: "#FFFFFF", color: INK, fontFamily: "DM Sans", fontSize: 10.5, lineHeight: 1.5, padding: 36, paddingBottom: 42 },
  script: { fontFamily: "Grand Hotel", lineHeight: 1.2 },
  kicker: { fontSize: 7, letterSpacing: 2, textTransform: "uppercase" },
  box: { borderWidth: 1, borderColor: INK, padding: 10 },
  small: { fontSize: 8.5, color: SOFT, lineHeight: 1.4 },
  storyP: { fontSize: 10.5, lineHeight: 1.55, marginBottom: 7 },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, fontSize: 7, color: SOFT, textAlign: "center" },
});

function bookFontSize(level: number, text: string) {
  const base = level <= 6 ? 19 : level <= 12 ? 16 : level <= 24 ? 13.5 : 11;
  if (text.length > DROP_PICTURE_AT) return Math.min(base, 11);
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

/** The page picture: a colouring-style outline drawing, or a light frame until it's made. */
function PagePicture({ page, height: fixed }: { page: ReaderPage; height?: number }) {
  if (page.text.length > DROP_PICTURE_AT) return null;
  const height = fixed ?? (page.text.length > SHRINK_PICTURE_AT ? 95 : 150);
  const pic = publicPath(page.picture);
  if (pic) return <Image src={pic} style={{ width: PANEL_W - 28, height, objectFit: "contain", marginBottom: 10 }} />;
  return (
    <View style={[p.pictureBox, { height }]}>
      <Text style={[p.small, { textAlign: "center", fontSize: 6.5 }]}>Picture to colour: {page.pictureBrief}</Text>
    </View>
  );
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
      <Text style={[p.small, { marginTop: 10, textAlign: "center" }]}>Read by {props.childName} · Level {props.level}</Text>
      {props.bookHeartWords.length > 0 && <HeartWords words={props.bookHeartWords} />}
    </View>,
  );

  // Pages 2–7: the story. Books are written with exactly six pages; an older,
  // shorter book gets a drawing page so no page is left blank.
  for (let i = 0; i < 6; i++) {
    const pg = inside[i];
    panels.set(
      i + 2,
      pg?.kind === "sound" ? (
        <>
          <Text style={[p.readerText, { fontSize: 42, fontWeight: 700, lineHeight: 1.35, marginBottom: 8 }]}>{pg.display}</Text>
          <PagePicture page={{ ...pg, text: "" }} height={120} />
          <Text style={[p.readerText, { fontSize: 18 }]}>{pg.text}</Text>
        </>
      ) : pg ? (
        <>
          <PagePicture page={pg} />
          <Text style={[p.readerText, { fontSize: pg.kind === "word" ? 30 : bookFontSize(props.level, pg.text) }]}>{pg.text}</Text>
        </>
      ) : (
        <View style={{ flexGrow: 1, width: "100%" }}>
          <Text style={[p.readerText, { fontSize: 11, marginBottom: 6 }]}>Draw your favourite part!</Text>
          <View style={{ flexGrow: 1, borderWidth: 0.75, borderColor: "#B5B5B5" }} />
        </View>
      ),
    );
  }

  // Back cover: The End, the reader's sign-off, and three stars to colour.
  panels.set(
    8,
    <View style={{ flexGrow: 1, alignItems: "center", justifyContent: "center", width: "100%" }}>
      <Text style={[p.script, { fontSize: 30 }]}>The End</Text>
      <Text style={[p.readerText, { fontSize: 12, marginTop: 2 }]}>I read it!</Text>
      <View style={{ flexDirection: "row", marginTop: 6, marginBottom: 14 }}>
        {[0, 1, 2].map((i) => (
          <Svg key={i} width={20} height={20} viewBox="0 0 24 24" style={{ marginHorizontal: 4 }}>
            <Polygon points="12,1.5 15.1,8.1 22.3,9 17,14 18.4,21.1 12,17.6 5.6,21.1 7,14 1.7,9 8.9,8.1" stroke={INK} strokeWidth={1.2} fill="none" />
          </Svg>
        ))}
      </View>
      <Text style={[p.readerText, { fontSize: 10 }]}>I read this book to</Text>
      <View style={{ borderBottomWidth: 0.75, borderColor: INK, width: "80%", height: 18 }} />
      <Text style={[p.readerText, { fontSize: 10, marginTop: 10 }]}>on</Text>
      <View style={{ borderBottomWidth: 0.75, borderColor: INK, width: "80%", height: 18 }} />
      <Text style={[p.script, { fontSize: 14, marginTop: 16 }]}>The Reading Routine</Text>
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
        <View key={page} style={[p.panel, { left: col * PANEL_W, top: row * PANEL_H }, row === 0 ? { transform: "rotate(180deg)" } : {}]}>
          {panels.get(page)}
          {page > 1 && page < 8 && <Text style={p.pageNum}>{page - 1}</Text>}
        </View>
      ))}
    </Page>
  );
}

function SparkWords(props: RoutinePdfProps) {
  return (
    <View wrap={false} style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 6 }}>
        <Text style={[p.script, { fontSize: 24, marginRight: 10 }]}>Tonight&apos;s Spark Words</Text>
        <Text style={p.small}>Show {props.childName} each word and picture, read what it means, then try the activity.</Text>
      </View>
      <View style={{ flexDirection: "row" }}>
        {props.sparkWords.map((w, i) => {
          const pic = publicPath(w.picture);
          return (
            <View key={w.word} style={[p.box, { flexGrow: 1, flexBasis: 0, marginLeft: i ? 8 : 0, alignItems: "center" }]}>
              {pic ? (
                <Image src={pic} style={{ height: 78, width: "100%", objectFit: "contain", marginBottom: 6 }} />
              ) : (
                <View style={[p.pictureBox, { width: "100%", height: 78, marginBottom: 6 }]}>
                  <Text style={[p.small, { fontSize: 6.5, textAlign: "center" }]}>Picture: {w.word}</Text>
                </View>
              )}
              {/* In clear print, so the child can see and read the word. */}
              <Text style={{ fontFamily: "Andika", fontWeight: 700, fontSize: 24, lineHeight: 1.35, marginBottom: 3 }}>{w.word}</Text>
              <Text style={{ fontWeight: 700, fontSize: 9.5, textAlign: "center", marginTop: 2 }}>{w.definition}</Text>
              <Text style={[p.small, { textAlign: "center", marginTop: 3 }]}>{w.introTip}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[p.small, { marginTop: 6, color: INK }]}>
        Then say: &quot;Listen for these Spark Words in the story. When you hear one, clap!&quot;
        {props.reviewWords.length > 0 &&
          `  Bonus: listen for ${props.reviewWords.map((w) => `"${w}"`).join(" and ")} from a few weeks ago. A double clap if they remember what it means!`}
      </Text>
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
            {props.dateLabel} · {chapter ? "Chapter book" : `Level ${props.level} · ${props.pattern}`}
          </Text>
        </View>
      </View>

      <SparkWords {...props} />

      {/* The story (or tonight's chapter) */}
      <View style={{ flexDirection: "row", alignItems: "baseline", borderTopWidth: 1, borderColor: INK, paddingTop: 10 }}>
        <Text style={[p.kicker, { flexGrow: 1 }]}>
          {chapter ? `${props.childName} reads tonight's chapter` : `After ${props.childName} reads their little book · you read · they listen and clap`}
        </Text>
      </View>
      <Text style={[p.script, { fontSize: 28, marginBottom: 6, marginTop: 2 }]}>{props.story.title}</Text>
      {props.story.paragraphs.map((para, i) => (
        <Text key={i} style={[p.storyP, chapter ? { fontFamily: "Andika", fontSize: 13 } : {}]}>
          {withSparkWords(para, words)}
        </Text>
      ))}
      <View style={[p.box, { marginTop: 6, backgroundColor: LINEN }]} wrap={false}>
        <Text style={{ fontWeight: 700 }}>Talk about it</Text>
        <Text>{props.story.talkQuestion}</Text>
      </View>

      {props.check && (
        <View style={[p.box, { marginTop: 12 }]} wrap={false}>
          <Text style={{ fontWeight: 700 }}>It&apos;s check night! Can {props.childName} read these words?</Text>
          <Text style={{ fontFamily: "Andika", fontSize: 16, marginVertical: 6, lineHeight: 1.5 }}>{props.check.words.join("     ")}</Text>
          <Text style={{ fontFamily: "Andika", fontSize: 12.5 }}>{props.check.passage}</Text>
          <Text style={[p.small, { marginTop: 6 }]}>Count the words read correctly, then record it from the link in tonight&apos;s email.</Text>
        </View>
      )}
      <Text style={p.footer} fixed render={({ pageNumber }) => `The Reading Routine · ${props.childName} · ${props.dateLabel}${pageNumber > 1 ? " · continued" : ""}`} />
    </Page>
  );
}

/** The heart words in the book, on its cover, to practise before reading. */
function HeartWords({ words }: { words: string[] }) {
  return (
    <View style={{ marginTop: 12, alignItems: "center", width: "100%" }}>
      <Text style={[p.kicker, { marginBottom: 4 }]}>heart words</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {words.map((w) => (
          <Text key={w} style={{ fontFamily: "Andika", fontSize: 12, borderWidth: 0.75, borderColor: INK, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, margin: 2 }}>
            {w}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function RoutinePrintPdf(props: RoutinePdfProps) {
  registerFonts();
  const logo = publicPath("/brand/clock-180.png");
  return (
    <Document title={`${props.childName}'s Reading Routine — ${props.dateLabel} (print)`} author="The Reading Routine">
      {props.mode !== "chapter" && props.reader && <LittleBook {...props} logo={logo} />}
      {props.colourSheet && <ColourSheetPage sheet={props.colourSheet} childName={props.childName} level={props.level} />}
      <ParentSheet {...props} logo={logo} />
    </Document>
  );
}
