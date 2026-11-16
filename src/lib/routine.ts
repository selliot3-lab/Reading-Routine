import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Child, Parent, Routine, RoutineSparkWord } from "./db/schema";
import { getLevel, MAX_LEVEL, warmUpFor } from "./curriculum";
import { nextLevel, readyToMoveUp, setLevel, type Feedback } from "./progression";
import { colourSheetFor, heartWordsIn, isHeartBook, pickReader, readerById, SPARK_WORDS, teachingBooksFor } from "./content";
import { countWord, pickReviewWords, pickSparkWords } from "./story/sparkWords";
import { writeChapter } from "./story/generate";
import { personalize, pickStory } from "./story/library";
import { renderRoutinePdf, type PdfFormat } from "./pdf/render";
import type { RoutinePdfProps } from "./pdf/RoutinePdf";
import { formatLongDate, localDate, localMinutes, parseHHMM } from "./time";
import { randomToken } from "./tokens";
import { env } from "./env";
import { sendEmail } from "./email";
import { routineEmail } from "./emails";

export async function buildRoutine(child: Child, forDate: string): Promise<Routine> {
  const existing = await db.query.routines.findFirst({
    where: and(eq(schema.routines.childId, child.id), eq(schema.routines.forDate, forDate)),
  });
  if (existing && existing.status !== "failed") return existing;

  const nightsAt = async (lv: number) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.routines)
      .where(and(eq(schema.routines.childId, child.id), eq(schema.routines.level, lv)));
    return count;
  };

  // Move up after two weeks at a level, or early after three "too easy" nights.
  let level = child.level;
  if (level <= MAX_LEVEL) {
    const recent = await db.query.routines.findMany({
      where: and(eq(schema.routines.childId, child.id), eq(schema.routines.level, level)),
      orderBy: desc(schema.routines.forDate),
      limit: 3,
    });
    if (readyToMoveUp(await nightsAt(level), recent.map((r) => r.feedback as Feedback))) {
      level = nextLevel(level);
      await setLevel(child.id, level);
      child = { ...child, level };
    }
  }
  const chapterMode = level > MAX_LEVEL;
  const count = await nightsAt(level);

  // A level opens with its teaching books: a sound book for each new sound,
  // then the heart-word book (with the colour-by-heart-word sheet). After
  // that, the level's story books in turn.
  const teaching = chapterMode ? [] : teachingBooksFor(level);
  const reader = chapterMode ? null : count < teaching.length ? teaching[count] : pickReader(level, count - teaching.length);

  const history = await db.query.sparkWordHistory.findMany({ where: eq(schema.sparkWordHistory.childId, child.id) });
  const alreadyMet = new Set(history.map((h) => h.word.toLowerCase()));
  const bankWord = (word: string): RoutineSparkWord => {
    const w = SPARK_WORDS.find((x) => x.word === word);
    return { word, definition: w?.definition ?? "", introTip: w?.introTip ?? "", picture: w?.picture ?? null, isNew: false };
  };

  let story;
  let sparkWords: RoutineSparkWord[];
  let reviewWords: string[];
  if (!chapterMode) {
    // Tonight's bedtime story comes from the prewritten library, personalized
    // here with the child's name, pronouns, special person and pet. The
    // story's Spark Words come with it.
    const past = await db.query.routines.findMany({ where: eq(schema.routines.childId, child.id) });
    const heard = new Set(past.flatMap((r) => (r.story?.storyId ? [r.story.storyId] : [])));
    const template = pickStory({ interests: child.interests, heard, metWords: alreadyMet, allowDrafts: env.ALLOW_DRAFT_STORIES });
    if (!template) throw new Error("No approved bedtime stories in the library yet.");
    const filled = personalize(template, child);
    story = {
      storyId: filled.storyId,
      title: filled.title,
      paragraphs: filled.paragraphs,
      beforeQuestion: filled.beforeQuestion,
      talkQuestion: filled.talkQuestion,
    };
    sparkWords = template.sparkWords.map(bankWord);
    // Bonus words: Spark Words met 2 or 4 weeks ago that also turn up in tonight's story.
    const text = filled.paragraphs.join(" ");
    const due = pickReviewWords(history.map((h) => ({ word: h.word, firstSeen: h.firstSeen })), forDate);
    const metInStory = history.map((h) => h.word).filter((w) => !template.sparkWords.includes(w) && countWord(text, w) > 0);
    reviewWords = [...new Set([...due.filter((w) => countWord(text, w) > 0), ...metInStory])].slice(0, 2);
  } else {
    // Graduates read a chapter book: Spark Words from the bank, a chapter written to continue the book.
    const picked = pickSparkWords({ interests: child.interests, alreadyMet, seed: `${child.id}:${forDate}` });
    sparkWords = picked.map((w) => bankWord(w.word));
    reviewWords = pickReviewWords(history.map((h) => ({ word: h.word, firstSeen: h.firstSeen })), forDate);
    const storyChild = {
      firstName: child.firstName,
      age: child.age,
      pronouns: child.pronouns,
      interests: child.interests,
      favouriteThings: child.favouriteThings,
      specialPeople: child.specialPeople,
      pets: child.pets,
    };
    const chapter = await writeChapter({ child: storyChild, sparkWords, reviewWords, book: child.chapterBook ?? null });
    story = { title: chapter.title, paragraphs: chapter.paragraphs, talkQuestion: chapter.talkQuestion, beforeQuestion: chapter.beforeQuestion };
    await db
      .update(schema.children)
      .set({ chapterBook: { title: chapter.bookTitle, summary: chapter.summary, chapter: (child.chapterBook?.chapter ?? 0) + 1 } })
      .where(eq(schema.children.id, child.id));
  }

  const values = {
    childId: child.id,
    forDate,
    level,
    mode: chapterMode ? "chapter" : "standard",
    readerId: reader?.id ?? null,
    sparkWords,
    reviewWords,
    story,
    includesCheck: false,
    token: existing?.token ?? randomToken(18),
    status: "ready",
    error: null,
  };
  const [routine] = existing
    ? await db.update(schema.routines).set(values).where(eq(schema.routines.id, existing.id)).returning()
    : await db.insert(schema.routines).values(values).returning();

  for (const w of sparkWords) {
    await db
      .insert(schema.sparkWordHistory)
      .values({ childId: child.id, word: w.word, firstSeen: forDate })
      .onConflictDoNothing();
  }
  return routine;
}

export function routineLinks(token: string) {
  const base = env.APP_URL.replace(/\/$/, "");
  return {
    pdf: `${base}/r/${token}`,
    screen: `${base}/r/${token}?format=screen`,
    feedback: (v: "too_hard" | "just_right" | "too_easy") => `${base}/f/${token}?v=${v}`,
    account: `${base}/account`,
  };
}

/** The sound a book is about, shown on its front: the level's new sounds, or the book's own sound. */
export function featuredFor(reader: ReturnType<typeof readerById>, level: number): string {
  // Sound and heart-word books are about their sound already, so only story books say it.
  if (!reader || reader.type === "heart" || reader.type === "sound") return "";
  return getLevel(Math.min(level, MAX_LEVEL)).patterns.split(" · ")[0];
}

export function pdfProps(routine: Routine, child: Child): RoutinePdfProps {
  const links = routineLinks(routine.token);
  const chapter = routine.mode === "chapter";
  const lv = getLevel(Math.min(routine.level, MAX_LEVEL));
  const heartWords = chapter ? [] : lvHeartWordsSoFar(routine.level);
  const reader = readerById(routine.readerId);
  return {
    childName: child.firstName,
    dateLabel: formatLongDate(routine.forDate),
    level: routine.level,
    mode: chapter ? "chapter" : "standard",
    pattern: lv.patterns,
    heartWords,
    reader,
    warmUp: chapter ? null : warmUpFor(routine.level, routine.forDate),
    featured: featuredFor(reader, routine.level),
    bookHeartWords: reader?.type === "heart" ? reader.pages.filter((pg) => pg.kind === "heart").map((pg) => pg.display!) : reader ? heartWordsIn(reader) : [],
    colourSheet: isHeartBook(reader) ? colourSheetFor(Math.min(routine.level, MAX_LEVEL)) : null,
    sparkWords: routine.sparkWords,
    reviewWords: routine.reviewWords,
    story: routine.story ?? { title: "", paragraphs: [], talkQuestion: "" },
    check: null,
    feedbackUrl: links.feedback,
    accountUrl: links.account,
  };
}

function lvHeartWordsSoFar(level: number): string[] {
  // The newest few heart words are the ones worth reminding parents about.
  const words: string[] = [];
  for (let l = Math.max(1, level - 2); l <= Math.min(level, MAX_LEVEL); l++) words.push(...getLevel(l).heartWords);
  return words;
}

export async function routinePdf(routine: Routine, child: Child, format: PdfFormat = "print"): Promise<Buffer> {
  return renderRoutinePdf(pdfProps(routine, child), format);
}

export async function deliverRoutine(routine: Routine, child: Child, parent: Parent): Promise<void> {
  const pdf = await routinePdf(routine, child);
  const links = routineLinks(routine.token);
  const email = routineEmail({ parent, child, routine, links });
  await sendEmail({
    to: parent.email,
    ...email,
    attachments: [
      {
        filename: `${child.firstName}-reading-routine-${routine.forDate}.pdf`,
        contentType: "application/pdf",
        content: pdf,
      },
    ],
  });
  await db.update(schema.routines).set({ status: "sent", sentAt: new Date() }).where(eq(schema.routines.id, routine.id));
}

/** Builds and sends one child's routine for their parent's local today. */
export async function runForChild(child: Child, parent: Parent, now = new Date()) {
  const forDate = localDate(parent.timezone, now);
  try {
    const routine = await buildRoutine(child, forDate);
    if (routine.status !== "sent") await deliverRoutine(routine, child, parent);
    return { child: child.id, ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Routine failed for child ${child.id}:`, message);
    await db
      .insert(schema.routines)
      .values({ childId: child.id, forDate, level: child.level, token: randomToken(18), status: "failed", error: message })
      .onConflictDoUpdate({
        target: [schema.routines.childId, schema.routines.forDate],
        set: { status: "failed", error: message },
      });
    return { child: child.id, ok: false as const, error: message };
  }
}

const BILLABLE = ["trialing", "active"];

/**
 * Called every 15 minutes by the scheduler. Sends each child's routine once
 * per local day, at or after the parent's chosen delivery time.
 */
export async function dispatchDue(now = new Date()) {
  const parents = await db.query.parents.findMany({
    where: and(inArray(schema.parents.subscriptionStatus, BILLABLE), eq(schema.parents.paused, false)),
  });
  const due = parents.filter((p) => localMinutes(p.timezone, now) >= parseHHMM(p.deliveryTime));
  const jobs: { child: Child; parent: Parent }[] = [];
  for (const parent of due) {
    const today = localDate(parent.timezone, now);
    const kids = await db.query.children.findMany({
      where: and(eq(schema.children.parentId, parent.id), eq(schema.children.active, true)),
    });
    for (const child of kids) {
      const done = await db.query.routines.findFirst({
        where: and(eq(schema.routines.childId, child.id), eq(schema.routines.forDate, today)),
      });
      // Failed routines are retried on the next run; sent ones are left alone.
      if (!done || done.status !== "sent") jobs.push({ child, parent });
    }
  }
  const results = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(jobs.slice(i, i + CONCURRENCY).map((j) => runForChild(j.child, j.parent, now)))));
  }
  return results;
}
