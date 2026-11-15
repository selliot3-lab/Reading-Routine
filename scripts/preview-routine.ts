/**
 * Builds a sample routine for a demo child and writes the PDF to ./.outbox.
 * Uses the mock story writer unless STORY_ENGINE=bedrock.
 * Run: npm run preview -- --level 3 --night 2
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { buildRoutine, routinePdf } from "../src/lib/routine";

const arg = (name: string, d: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : d;
};

async function main() {
  const level = Number(arg("level", "3"));
  const email = "preview@example.com";
  let parent = await db.query.parents.findFirst({ where: eq(schema.parents.email, email) });
  parent ??= (await db.insert(schema.parents).values({ email, firstName: "Preview" }).returning())[0];
  await db.delete(schema.children).where(eq(schema.children.parentId, parent.id));
  const [child] = await db
    .insert(schema.children)
    .values({
      parentId: parent.id,
      firstName: "Maya",
      age: 6,
      pronouns: "she",
      level,
      interests: ["dinosaurs", "ocean", "sports"],
      favouriteThings: "hockey, her stuffed whale",
      specialPeople: [{ name: "Nana", relation: "grandma" }, { name: "Leo", relation: "brother" }],
      pets: [{ name: "Biscuit", kind: "dog" }],
    })
    .returning();
  // A level opens with its sound books, then its heart-word book; story books follow.
  const night = Number(arg("night", "1"));
  const start = Date.parse(arg("date", new Date().toISOString().slice(0, 10)));
  let routine = await buildRoutine(child, new Date(start).toISOString().slice(0, 10));
  for (let n = 2; n <= night; n++) routine = await buildRoutine(child, new Date(start + (n - 1) * 86_400_000).toISOString().slice(0, 10));
  await mkdir(".outbox", { recursive: true });
  for (const format of ["print", "screen"] as const) {
    const pdf = await routinePdf(routine, child, format);
    const out = `.outbox/preview-level-${level}-night-${night}-${format}.pdf`;
    await writeFile(out, pdf);
    console.log(`Wrote ${out} (${Math.round(pdf.length / 1024)} KB)`);
  }
  console.log(`Spark Words: ${routine.sparkWords.map((w) => w.word).join(", ")}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
