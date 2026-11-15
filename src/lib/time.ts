/** The parent's local calendar date (YYYY-MM-DD) in their time zone. */
export function localDate(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Minutes since local midnight in the parent's time zone. */
export function localMinutes(timezone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatLongDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Canadian time zones first, for the onboarding picker. */
export const TIMEZONES = [
  { id: "America/St_Johns", label: "Newfoundland" },
  { id: "America/Halifax", label: "Atlantic (Halifax)" },
  { id: "America/Toronto", label: "Eastern (Toronto, Ottawa, Thunder Bay)" },
  { id: "America/Winnipeg", label: "Central (Winnipeg)" },
  { id: "America/Regina", label: "Saskatchewan" },
  { id: "America/Edmonton", label: "Mountain (Edmonton, Calgary)" },
  { id: "America/Vancouver", label: "Pacific (Vancouver)" },
  { id: "America/Whitehorse", label: "Yukon" },
];
