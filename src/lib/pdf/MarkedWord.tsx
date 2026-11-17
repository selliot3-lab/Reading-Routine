import React from "react";
import { Circle, Path, Svg, Text, View } from "@react-pdf/renderer";
import { markedParts } from "../heartMarks";
import { INK } from "./RoutinePdf";

export function HeartIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3.1 1.6-1.9 3.1-3.1 5.2-3.1 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" stroke={INK} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

/*
 * A heart word with a marker under each part: a dot where the spelling says
 * its usual sound, and a heart where it is unexpected. Words without marks yet
 * are shown plainly.
 */
export function MarkedWord({ word, size = 16 }: { word: string; size?: number }) {
  const shown = word.toLowerCase() === "i" ? "I" : word;
  const parts = markedParts(word);
  if (!parts) return <Text style={{ fontFamily: "Andika", fontSize: size }}>{shown}</Text>;
  const textH = size * 1.7; // room for the letters' full line height, so nothing is clipped
  const markH = size * 0.55; // fixed height for the marker under them
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {parts.map(([text, kind], i) => (
        <View key={i} style={{ alignItems: "center" }}>
          <View style={{ height: textH }}>
            <Text style={{ fontFamily: "Andika", fontSize: size, lineHeight: 1.2 }}>{text === "i" && word.toLowerCase() === "i" ? "I" : text}</Text>
          </View>
          <View style={{ height: markH, width: size * 0.6, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
            {kind === "d" ? (
              <Svg width={size * 0.3} height={size * 0.3} viewBox="0 0 10 10">
                <Circle cx={5} cy={5} r={4.5} fill={INK} />
              </Svg>
            ) : (
              <HeartIcon size={size * 0.42} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

/** The heart words on a book's front, with the key that explains the markers. */
export function HeartWordsFront({ words, size = 12 }: { words: string[]; size?: number }) {
  if (words.length === 0) return null;
  return (
    <View style={{ marginTop: 12, alignItems: "center", width: "100%" }}>
      <Text style={{ fontSize: 7, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>heart words</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {words.map((w) => (
          <View key={w} style={{ borderWidth: 0.75, borderColor: INK, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, margin: 2 }}>
            <MarkedWord word={w} size={size} />
          </View>
        ))}
      </View>
    </View>
  );
}
