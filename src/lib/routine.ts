import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Child, Parent, Routine, RoutineSparkWord } from "./db/schema";
import { getLevel, MAX_LEVEL } from "./curriculum";
import { pickReader, readerById, SPARK_WORDS } from "./content";
import { pickReviewWords, pickSparkWords } from "./story/sparkWords";
import { proposeSparkWords, writeBedtimeStory, writeChapter } from "./story/generate";
import { renderRoutinePdf, type PdfFormat } from "./pdf/render";
import type { RoutinePdfProps } from "./pdf/RoutinePdf";
import { formatLongDate, localDate, localMinutes, parseHHMM } from "./time";
import { randomToken } from "./tokens";
import { env } from "./env";
import { sendEmail } from "./email";
import { routineEmail } from "./emails";

/** Nights a child stays on a level before the weekly check (from the scope & sequence: 2 weeks per level, checked weekly). */
const CHECK_EVERY = 7;

export async function buildRoutine(child: Child, forDate: string): Promise<Routine> {
  const existing = await db.query.routines.findFirst({
    where: and(eq(schema.routines.childId, child.id), eq(schema.routines.forDate, forDate)),
  });
  if (existing && existing.status !== "failed") return existing;

  const level = child.level;
  const chapterMode = level > MAX_LEVEL;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.routines)
    .where(and(eq(schema.routines.childId, child.id), eq(schema.routines.level, level)));

  const recent = await db.query.routines.findMany({
    where: eq(schema.routines.childId, child.id),
    orderBy: desc(schema.routines.forDate),
    limit: 3,
  });
  const askedForCheck = recent.length === 3 && recent.every((r) => r.feedback === "too_easy");
  const includesCheck = !chapterMode && ((count + 1) % CHECK_EVERY === 0 || askedForCheck);

  const reader = chapterMode ? null : pickReader(level, count);

  // Spark Words: bank words for the child's interests, never repeated.
  const history = await db.query.sparkWordHistory.findMany({ where: eq(schema.sparkWordHistory.childId, child.id) });
  const alreadyMet = new Set(history.map((h) => h.word.toLowerCase()));
  const picked = pickSparkWords({ interests: child.interests, alreadyMet, seed: `${child.id}:${forDate}` });
  const sparkWords: RoutineSparkWord[] = picked.map((w) => ({
    word: w.word,
    definition: w.definition,
    introTip: w.introTip,
    picture: w.picture,
    isNew: false,
  }));
  if (sparkWords.length < 3) {
    const extra = await proposeSparkWords({
      count: 3 - sparkWords.length,
      interests: child.interests,
      favouriteThings: child.favouriteThings,
      age: child.age,
      avoid: [...alreadyMet, ...sparkWords.map((w) => w.word), ...SPARK_WORDS.map((w) => w.word)],
    });
    for (const w of extra) {
      sparkWords.push({ word: w.word, definition: w.definition, introTip: w.introTip, picture: null, isNew: true });
      await db.insert(schema.proposedWords).values({ word: w.word, definition: w.definition, interest: w.interest });
    }
  }
  const reviewWords = pickReviewWords(
    history.map((h) => ({ word: h.word, firstSeen: h.firstSeen })),
    forDate,
  );

  const storyChild = {
    firstName: child.firstName,
    age: child.age,
    pronouns: child.pronouns,
    interests: child.interests,
    favouriteThings: child.favouriteThings,
    specialPeople: child.specialPeople,
    pets: child.pets,
  };

  let story;
  if (chapterMode) {
    const chapter = await writeChapter({ child: storyChild, sparkWords, reviewWords, book: child.chapterBook ?? null });
    story = { title: chapter.title, paragraphs: chapter.paragraphs, talkQuestion: chapter.talkQuestion };
    await db
      .update(schema.children)
      .set({ chapterBook: { title: chapter.bookTitle, summary: chapter.summary, chapter: (child.chapterBook?.chapter ?? 0) + 1 } })
      .where(eq(schema.children.id, child.id));
  } else {
    const lv = getLevel(level);
    story = await writeBedtimeStory({
      child: storyChild,
      sparkWords,
      reviewWords,
      pattern: lv.patterns,
      patternWords: lv.sampleWords,
    });
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
    includesCheck,
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
    check: `${base}/check/${token}`,
    feedback: (v: "too_hard" | "just_right" | "too_easy") => `${base}/f/${token}?v=${v}`,
    account: `${base}/account`,
  };
}

export function pdfProps(routine: Routine, child: Child): RoutinePdfProps {
  const links = routineLinks(routine.token);
  const chapter = routine.mode === "chapter";
  const lv = getLevel(Math.min(routine.level, MAX_LEVEL));
  const heartWords = chapter ? [] : lvHeartWordsSoFar(routine.level);
  return {
    childName: child.firstName,
    dateLabel: formatLongDate(routine.forDate),
    level: routine.level,
    mode: chapter ? "chapter" : "standard",
    pattern: lv.patterns,
    heartWords,
    reader: readerById(routine.readerId),
    sparkWords: routine.sparkWords,
    reviewWords: routine.reviewWords,
    story: routine.story ?? { title: "", paragraphs: [], talkQuestion: "" },
    check: routine.includesCheck ? { words: lv.checkWords, passage: lv.checkPassage, url: links.check } : null,
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
