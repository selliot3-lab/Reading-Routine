import React from "react";
import { Circle, Path, Svg, Text, View } from "@react-pdf/renderer";
import { markedParts } from "../heartMarks";
import { INK, SOFT } from "./RoutinePdf";

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
  const dot = size * 0.22;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
      {parts.map(([text, kind], i) => (
        <View key={i} style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: "Andika", fontSize: size, lineHeight: 1.15 }}>{text === "i" && word.toLowerCase() === "i" ? "I" : text}</Text>
          {kind === "d" ? (
            <Svg width={dot * 2} height={dot * 2} style={{ marginTop: 1 }}>
              <Circle cx={dot} cy={dot} r={dot * 0.8} fill={INK} />
            </Svg>
          ) : (
            <View style={{ marginTop: 1 }}>
              <HeartIcon size={size * 0.5} />
            </View>
          )}
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
      <Text style={{ fontSize: 6.5, color: SOFT, marginTop: 8 }}>dot = sounds the usual way · heart = the tricky part</Text>
    </View>
  );
}
