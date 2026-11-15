import type { Metadata } from "next";
import { INTERESTS } from "@/lib/content";
import { PLACEMENT_CHECKPOINTS, placementWords } from "@/lib/curriculum";
import { TIMEZONES } from "@/lib/time";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Start your free trial — The Reading Routine" };

export default function StartPage() {
  const checkpoints = PLACEMENT_CHECKPOINTS.map((level) => ({ level, words: placementWords(level) }));
  return (
    <div className="stripes" style={{ padding: "40px 0", minHeight: "70vh" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <Onboarding interests={INTERESTS} checkpoints={checkpoints} timezones={TIMEZONES} />
      </div>
    </div>
  );
}
