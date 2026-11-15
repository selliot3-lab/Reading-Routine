import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { RoutinePdf, type RoutinePdfProps } from "./RoutinePdf";
import { RoutinePrintPdf } from "./RoutinePrintPdf";

export type PdfFormat = "print" | "screen";

/**
 * "print": a one-sheet fold-up little book for the child + one parent sheet.
 * "screen": the same routine laid out one page at a time, for phones and tablets.
 */
export async function renderRoutinePdf(props: RoutinePdfProps, format: PdfFormat = "print"): Promise<Buffer> {
  const component = format === "print" ? RoutinePrintPdf : RoutinePdf;
  // Both components return a <Document>, which is what renderToBuffer expects.
  const element = React.createElement(component, props) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}
