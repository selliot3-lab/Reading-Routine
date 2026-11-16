/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt prop */
import React from "react";
import { Image, Line, Path, Svg, Text, View } from "@react-pdf/renderer";
import type { BookCover, FillItem, HuntItem, ReaderPage } from "../content";
import { INK, SOFT, publicPath } from "./RoutinePdf";

/*
 * Activity pages for the teaching books (letter books, pattern books and
 * heart-word books). Drawn at "print" size inside a fold-book panel, and at
 * "screen" size (s = 1.75) on the phone/tablet version.
 */

const GREY = "#B5B5B5";
const TRACE = "#C9C9C9";

function Prompt({ text, s }: { text?: string; s: number }) {
  if (!text) return null;
  return <Text style={{ fontSize: 7.2 * s, color: SOFT, textAlign: "center", lineHeight: 1.35, marginBottom: 6 * s }}>{text}</Text>;
}

function Picture({ brief, picture, width, height, s }: { brief: string; picture: string | null; width: number; height: number; s: number }) {
  const pic = publicPath(picture);
  if (pic) return <Image src={pic} style={{ width, height, objectFit: "contain" }} />;
  return (
    <View style={{ width, height, borderWidth: 0.75, borderColor: GREY, borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 4 }}>
      <Text style={{ fontSize: 6 * s, color: SOFT, textAlign: "center" }}>{brief}</Text>
    </View>
  );
}

export function HeartIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3.1 1.6-1.9 3.1-3.1 5.2-3.1 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" stroke={INK} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

const reader = { fontFamily: "Andika", textAlign: "center" as const, lineHeight: 1.3 };

/*
 * Andika's measurements (units per em 2048): ascent 2500, cap height 1485,
 * x-height 1040. Capitals fill the row from the top line to the baseline,
 * and the dashed line sits at the x-height, so lowercase letters fit under it.
 */
const ANDIKA = { ascent: 2500 / 2048, cap: 1485 / 2048, x: 1040 / 2048 };

/** One row of handwriting lines (top, dashed x-height, baseline), with letters to trace. */
function WriteRow({ letter, copies, width, s }: { letter: string; copies: number; width: number; s: number }) {
  const h = 32 * s;
  const size = h / ANDIKA.cap;
  const mid = h - size * ANDIKA.x;
  return (
    <View style={{ width, height: h, marginTop: 10 * s, position: "relative" }}>
      <Svg width={width} height={h + 1} style={{ position: "absolute", top: 0, left: 0 }}>
        <Line x1={0} y1={0.5} x2={width} y2={0.5} stroke={INK} strokeWidth={0.6} />
        <Line x1={0} y1={mid} x2={width} y2={mid} stroke={GREY} strokeWidth={0.6} strokeDasharray="3 3" />
        <Line x1={0} y1={h} x2={width} y2={h} stroke={INK} strokeWidth={0.9} />
      </Svg>
      {Array.from({ length: copies }, (_, i) => (
        <Text
          key={i}
          style={{ position: "absolute", top: h - size * ANDIKA.ascent, left: (width / copies) * i + width / copies / 2 - size * 0.3, fontFamily: "Andika", fontSize: size, color: TRACE }}
        >
          {letter}
        </Text>
      ))}
    </View>
  );
}

/** The cover of a letter book: its character, the letters, how to say it and the action. */
export function LetterCover({ cover, say, s = 1, width }: { cover: BookCover; say?: string; s?: number; width: number }) {
  return (
    <View style={{ alignItems: "center", width }}>
      <Picture brief={`Character: ${cover.pictureBrief}`} picture={cover.picture} width={width * 0.7} height={60 * s} s={s} />
      <Text style={[reader, { fontSize: 34 * s, fontWeight: 700, lineHeight: 1.35, marginTop: 10 * s, marginBottom: 6 * s }]}>{cover.display}</Text>
      <Text style={[reader, { fontSize: 12 * s, fontWeight: 700, marginTop: 4 * s }]}>{cover.character}</Text>
      {say && <Text style={{ fontSize: 7.5 * s, marginTop: 4 * s }}>Say: {say}</Text>}
      <Text style={{ fontSize: 7 * s, color: SOFT, textAlign: "center", lineHeight: 1.35, marginTop: 4 * s }}>{cover.action}</Text>
    </View>
  );
}

export function ActivityPage({ page, width, s = 1 }: { page: ReaderPage; width: number; s?: number }) {
  switch (page.kind) {
    case "poem":
      return (
        <View style={{ alignItems: "center", width }}>
          <Picture brief={page.pictureBrief} picture={page.picture} width={width * 0.6} height={62 * s} s={s} />
          <Text style={[reader, { fontSize: 9.5 * s, lineHeight: 1.45, marginVertical: 8 * s }]}>{page.text}</Text>
          <Prompt text={page.prompt} s={s} />
        </View>
      );
    case "hunt":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width }}>
            {(page.items as HuntItem[]).map((it) => (
              <View key={it.word} style={{ width: width / 2 - 4 * s, alignItems: "center", marginBottom: 8 * s }}>
                <Picture brief={it.pictureBrief} picture={it.picture} width={width / 2 - 4 * s} height={72 * s} s={s} />
                <Text style={[reader, { fontSize: 10 * s, marginTop: 2 * s }]}>{it.word}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case "find": {
      const n = page.grid!.length;
      const cols = n >= 25 ? 5 : n > 12 ? 4 : 3;
      const cell = width / cols;
      const long = page.grid!.some((g) => g.length > 3);
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", width }}>
            {page.grid!.map((g, i) => (
              <View key={i} style={{ width: cell, height: cell * (cols === 3 ? 0.62 : 0.85), alignItems: "center", justifyContent: "center" }}>
                <Text style={[reader, { fontSize: (long ? 10.5 : 17) * s }]}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    case "write":
      return (
        <View style={{ alignItems: "center", width }}>
          <Text style={[reader, { fontSize: 40 * s, fontWeight: 700, lineHeight: 1.2 }]}>{page.display}</Text>
          <Prompt text={page.prompt} s={s} />
          <WriteRow letter={page.display!} copies={3} width={width} s={s} />
          <WriteRow letter={page.display!} copies={3} width={width} s={s} />
          <WriteRow letter={page.display!} copies={0} width={width} s={s} />
          <WriteRow letter={page.display!} copies={0} width={width} s={s} />
        </View>
      );
    case "pattern":
      return (
        <View style={{ alignItems: "center", width }}>
          <Text style={[reader, { fontSize: (page.display!.length > 8 ? 17 : 30) * s, fontWeight: 700, lineHeight: 1.3 }]}>{page.display}</Text>
          {page.character ? (
            <>
              <Picture brief={page.pictureBrief} picture={page.picture} width={width * 0.6} height={56 * s} s={s} />
              <Text style={[reader, { fontSize: 10.5 * s, fontWeight: 700, marginTop: 3 * s }]}>{page.character}</Text>
              <Text style={{ fontSize: 7 * s, color: SOFT, textAlign: "center", lineHeight: 1.3, marginBottom: 4 * s }}>{page.action}</Text>
            </>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 4 * s }}>
            {page.spellings!.map((sp, i) => (
              <View key={i} style={{ borderWidth: 0.75, borderColor: INK, borderRadius: 6 * s, paddingHorizontal: 5 * s, paddingVertical: 2 * s, margin: 2 * s, alignItems: "center" }}>
                <Text style={[reader, { fontSize: 13 * s, fontWeight: 700 }]}>{sp.spelling}</Text>
                <Text style={[reader, { fontSize: 8 * s }]}>{sp.keyword}</Text>
              </View>
            ))}
          </View>
          <Prompt text={page.prompt} s={s} />
        </View>
      );
    case "sort": {
      const cols = page.columns!;
      const colW = width / cols.length;
      const rows = Math.max(...cols.map((c) => c.words.length));
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", borderWidth: 0.75, borderColor: GREY, padding: 3 * s, marginBottom: 6 * s, width }}>
            {page.words!.map((w, i) => (
              <Text key={i} style={[reader, { fontSize: 9.5 * s, marginHorizontal: 4 * s }]}>{w}</Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", width }}>
            {cols.map((c, i) => (
              <View key={i} style={{ width: colW, paddingHorizontal: 2 * s, borderLeftWidth: i ? 0.5 : 0, borderColor: GREY }}>
                <Text style={[reader, { fontSize: (cols.length > 3 ? 7 : 8) * s, fontWeight: 700, marginBottom: 2 * s }]}>{c.heading}</Text>
                {Array.from({ length: rows }, (_, j) => (
                  <View key={j} style={{ borderBottomWidth: 0.6, borderColor: INK, height: 16 * s }} />
                ))}
              </View>
            ))}
          </View>
        </View>
      );
    }
    case "fill":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width }}>
            {(page.items as FillItem[]).map((it) => (
              <View key={it.word} style={{ width: width / 2 - 4 * s, alignItems: "center", marginBottom: 8 * s }}>
                <Picture brief={it.pictureBrief} picture={it.picture} width={width / 2 - 4 * s} height={52 * s} s={s} />
                <Text style={[reader, { fontSize: 13 * s, letterSpacing: 1.5 * s, marginTop: 3 * s }]}>{it.blanked}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case "readDraw":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          {page.words!.map((w, i) => (
            <View key={i} style={{ width, marginBottom: 6 * s }}>
              <Text style={[reader, { fontSize: 11 * s, marginBottom: 3 * s }]}>{w}</Text>
              <View style={{ width, height: (page.words!.length > 1 ? 80 : 160) * s, borderWidth: 0.75, borderColor: GREY }} />
            </View>
          ))}
        </View>
      );
    case "sums":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          {page.sums!.map(([a, b], i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 12 * s }}>
              <Text style={[reader, { fontSize: 12 * s }]}>
                {a} + {b} ={" "}
              </Text>
              <View style={{ width: width * 0.4, borderBottomWidth: 0.75, borderColor: INK, height: 14 * s }} />
            </View>
          ))}
        </View>
      );
    case "silly":
      return (
        <View style={{ alignItems: "center", width }}>
          <Picture brief={page.pictureBrief} picture={page.picture} width={width} height={95 * s} s={s} />
          <Text style={[reader, { fontSize: 12.5 * s, marginVertical: 8 * s }]}>{page.text}</Text>
          <Prompt text={page.prompt} s={s} />
        </View>
      );
    case "heart":
      return (
        <View style={{ alignItems: "center", width }}>
          <HeartIcon size={22 * s} />
          <Text style={[reader, { fontSize: 34 * s, fontWeight: 700, lineHeight: 1.35, marginVertical: 6 * s }]}>{page.display}</Text>
          {page.text ? <Text style={[reader, { fontSize: 13 * s, marginBottom: 10 * s }]}>{page.text}</Text> : null}
          <Prompt text={page.prompt} s={s} />
        </View>
      );
    case "talk":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", width }}>
            {page.words!.map((w, i) => (
              <View key={i} style={{ borderWidth: 0.75, borderColor: INK, borderRadius: 8 * s, paddingHorizontal: 6 * s, paddingVertical: 2 * s, margin: 3 * s }}>
                <Text style={[reader, { fontSize: 13 * s }]}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    default:
      return null;
  }
}
