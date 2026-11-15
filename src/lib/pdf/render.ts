import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { RoutinePdf, type RoutinePdfProps } from "./RoutinePdf";

export async function renderRoutinePdf(props: RoutinePdfProps): Promise<Buffer> {
  // RoutinePdf returns a <Document>, which is what renderToBuffer expects.
  const element = React.createElement(RoutinePdf, props) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}
