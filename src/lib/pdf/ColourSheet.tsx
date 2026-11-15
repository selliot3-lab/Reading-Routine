import React from "react";
import { Circle, Page, Svg, Text, View } from "@react-pdf/renderer";
import type { ColourSheet } from "../content";
import { INK, SOFT } from "./RoutinePdf";

/**
 * "Colour by heart word": each heart word has a crayon colour; the child finds
 * every copy of it in a sea of words and colours it to match. Black and white,
 * so it prints on any printer.
 */
export function ColourSheetPage(props: { sheet: ColourSheet; childName: string; level: number; size?: "LETTER" | [number, number] }) {
  const { sheet } = props;
  const compact = Array.isArray(props.size);
  const perRow = compact ? 4 : 6;
  const rows: string[][] = [];
  for (let i = 0; i < sheet.sea.length; i += perRow) rows.push(sheet.sea.slice(i, i + perRow));
  return (
    <Page size={props.size ?? "LETTER"} style={{ backgroundColor: "#FFFFFF", color: INK, fontFamily: "DM Sans", padding: compact ? 22 : 36 }}>
      <Text style={{ fontSize: 7, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>level {props.level} · heart words</Text>
      <Text style={{ fontFamily: "Grand Hotel", fontSize: compact ? 26 : 34, textAlign: "center", lineHeight: 1.2 }}>Colour by Heart Word</Text>
      <Text style={{ fontSize: compact ? 8.5 : 10, color: SOFT, textAlign: "center", marginBottom: 12, lineHeight: 1.4 }}>
        First, colour each circle with its crayon. Then find every heart word in the sea and colour it to match!
        {sheet.review ? " Some are from earlier levels, for review." : ""}
      </Text>

      {/* The key: word, crayon name, and a circle to colour in first */}
      <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
        {sheet.words.map(({ word, colour }) => (
          <View
            key={word}
            style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: INK, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 9, margin: 4 }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" style={{ marginRight: 7 }}>
              <Circle cx={12} cy={12} r={10} stroke={INK} strokeWidth={1.3} fill="none" />
            </Svg>
            <View>
              <Text style={{ fontFamily: "Andika", fontWeight: 700, fontSize: compact ? 16 : 20, lineHeight: 1.2 }}>{word}</Text>
              <Text style={{ fontSize: 8, color: SOFT }}>{colour}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* The sea of words */}
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: "row", justifyContent: "center", marginBottom: compact ? 6 : 8, marginLeft: r % 2 ? 26 : 0, marginRight: r % 2 ? 0 : 26 }}>
          {row.map((w, i) => (
            <View
              key={i}
              style={{
                width: compact ? 72 : 76,
                height: compact ? 34 : 44,
                borderWidth: 1,
                borderColor: INK,
                borderRadius: 22,
                marginHorizontal: compact ? 3 : 5,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Andika", fontSize: compact ? 13 : 16 }}>{w}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={{ fontSize: 8, color: SOFT, textAlign: "center", marginTop: 6 }}>
        How many of each did you find? Count them together.
      </Text>
    </Page>
  );
}
