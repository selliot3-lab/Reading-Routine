/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt prop */
import React from "react";
import { Image, Path, Svg, Text, View } from "@react-pdf/renderer";
import type { ReaderPage } from "../content";
import { INK, SOFT, publicPath } from "./RoutinePdf";

/*
 * Activity pages for the teaching books (sound books and heart-word books).
 * Drawn at "print" size inside a fold-book panel, and at "screen" size
 * (s = 1.8) on the phone/tablet version.
 */

const GREY = "#B5B5B5";

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

export function ActivityPage({ page, width, s = 1 }: { page: ReaderPage; width: number; s?: number }) {
  switch (page.kind) {
    case "meet":
      return (
        <View style={{ alignItems: "center", width }}>
          <Text style={[reader, { fontSize: (page.display!.length > 6 ? 20 : 40) * s, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 * s }]}>{page.display}</Text>
          <Picture brief={page.pictureBrief} picture={page.picture} width={width} height={100 * s} s={s} />
          <Text style={[reader, { fontSize: 16 * s, marginTop: 6 * s, marginBottom: 6 * s }]}>{page.text}</Text>
          <Prompt text={page.prompt} s={s} />
        </View>
      );
    case "hunt":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", width }}>
            {page.items!.map((it) => (
              <View key={it.word} style={{ width: width / 2 - 4 * s, alignItems: "center", marginBottom: 8 * s }}>
                <Picture brief={it.pictureBrief} picture={it.picture} width={width / 2 - 4 * s} height={70 * s} s={s} />
                <Text style={{ fontSize: 7 * s, color: SOFT, marginTop: 2 * s }}>{it.word}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case "listen":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          {page.words!.map((w) => (
            <View key={w} style={{ flexDirection: "row", alignItems: "center", width: width * 0.8, marginBottom: 7 * s }}>
              <View style={{ width: 11 * s, height: 11 * s, borderRadius: 6 * s, borderWidth: 0.75, borderColor: INK, marginRight: 10 * s }} />
              <Text style={[reader, { fontSize: 15 * s, textAlign: "left" }]}>{w}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 6.5 * s, color: SOFT, marginTop: 4 * s, textAlign: "center" }}>Colour a circle for every clap.</Text>
        </View>
      );
    case "find": {
      const cols = page.grid!.length > 12 ? 4 : 3;
      const cell = width / cols;
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", width }}>
            {page.grid!.map((g, i) => (
              <View key={i} style={{ width: cell, height: cell * (cols === 4 ? 0.9 : 0.7), alignItems: "center", justifyContent: "center" }}>
                <Text style={[reader, { fontSize: (g.length > 3 ? 11 : 17) * s }]}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    case "robot":
      return (
        <View style={{ alignItems: "center", width }}>
          <Prompt text={page.prompt} s={s} />
          {page.segments!.map((parts, i) => {
            const box = Math.min(28 * s, (width - 4) / Math.max(parts.length, 1) - 4 * s);
            const wide = parts.some((p) => p.length > 2);
            return (
              <View key={i} style={{ alignItems: "center", marginBottom: 10 * s }}>
                <View style={{ flexDirection: "row" }}>
                  {parts.map((p, j) => (
                    <View
                      key={j}
                      style={{
                        minWidth: box,
                        height: box,
                        paddingHorizontal: wide ? 4 * s : 0,
                        borderWidth: 1,
                        borderColor: INK,
                        marginHorizontal: 2 * s,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={[reader, { fontSize: 14 * s }]}>{p}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ borderBottomWidth: 0.75, borderColor: SOFT, width: "80%", marginTop: 4 * s }} />
              </View>
            );
          })}
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
