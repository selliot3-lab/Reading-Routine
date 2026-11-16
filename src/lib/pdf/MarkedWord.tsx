import React from "react";
import { Circle, Svg, Text, View } from "@react-pdf/renderer";
import { markedParts } from "../heartMarks";
import { INK, SOFT } from "./RoutinePdf";
import { HeartIcon } from "./ActivityPage";

/*
 * A heart word with a marker under each part: a dot where the spelling says
 * its usual sound, and a heart where it is unexpected. Words without marks yet
 * are shown plainly.
 */
export function MarkedWord({ word, size = 16 }: { word: string; size?: number }) {
  const parts = markedParts(word);
  if (!parts) return <Text style={{ fontFamily: "Andika", fontSize: size }}>{word}</Text>;
  const dot = size * 0.22;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
      {parts.map(([text, kind], i) => (
        <View key={i} style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: "Andika", fontSize: size, lineHeight: 1.15 }}>{text}</Text>
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
