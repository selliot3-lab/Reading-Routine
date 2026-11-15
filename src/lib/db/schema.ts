import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export type SpecialPerson = { name: string; relation: string };
export type Pet = { name: string; kind: string };

export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  /** IANA zone, e.g. America/Toronto */
  timezone: text("timezone").notNull().default("America/Toronto"),
  /** Local delivery time "HH:MM", 24h */
  deliveryTime: text("delivery_time").notNull().default("18:30"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  /** trialing | active | past_due | canceled | incomplete | none */
  subscriptionStatus: text("subscription_status").notNull().default("none"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  paused: boolean("paused").notNull().default(false),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const children = pgTable(
  "children",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    age: integer("age"),
    /** she | he | they — used so stories refer to the child correctly */
    pronouns: text("pronouns").notNull().default("they"),
    interests: jsonb("interests").$type<string[]>().notNull().default([]),
    favouriteThings: text("favourite_things"),
    specialPeople: jsonb("special_people").$type<SpecialPerson[]>().notNull().default([]),
    pets: jsonb("pets").$type<Pet[]>().notNull().default([]),
    /** 1–40 = phonics levels; 41 = graduated to chapter mode */
    level: integer("level").notNull().default(1),
    /** Readers seen at the current level, so the library rotates. */
    levelStartedAt: date("level_started_at"),
    placement: jsonb("placement").$type<Record<string, boolean[]>>(),
    /** Graduate mode: the running book */
    chapterBook: jsonb("chapter_book").$type<{ title: string; summary: string; chapter: number } | null>(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("children_parent_idx").on(t.parentId)],
);

export type RoutineStory = {
  title: string;
  paragraphs: string[];
  talkQuestion: string;
  /** A prediction question to ask before reading, from the title. */
  beforeQuestion?: string;
  /** Which library story this was, so a child never hears the same one twice. */
  storyId?: string;
};

export type RoutineSparkWord = {
  word: string;
  definition: string;
  introTip: string;
  picture: string | null;
  isNew: boolean;
};

export const routines = pgTable(
  "routines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    /** The child's local date this routine is for */
    forDate: date("for_date").notNull(),
    level: integer("level").notNull(),
    /** standard (reader + bedtime story) | chapter (graduate) */
    mode: text("mode").notNull().default("standard"),
    readerId: text("reader_id"),
    sparkWords: jsonb("spark_words").$type<RoutineSparkWord[]>().notNull().default([]),
    reviewWords: jsonb("review_words").$type<string[]>().notNull().default([]),
    story: jsonb("story").$type<RoutineStory>(),
    includesCheck: boolean("includes_check").notNull().default(false),
    /** Public, unguessable token for the PDF and feedback links */
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    feedback: text("feedback"),
    feedbackAt: timestamp("feedback_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("routines_child_date_uq").on(t.childId, t.forDate)],
);

export const checks = pgTable("checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
  level: integer("level").notNull(),
  score: integer("score").notNull(),
  outOf: integer("out_of").notNull(),
  /** 1 word by word · 2 short phrases · 3 smooth with expression */
  fluency: integer("fluency"),
  decision: text("decision").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Every Spark Word a child has met, so words come back 2 and 4 weeks later. */
export const sparkWordHistory = pgTable(
  "spark_word_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    firstSeen: date("first_seen").notNull(),
  },
  (t) => [uniqueIndex("spark_child_word_uq").on(t.childId, t.word)],
);

/** Words the story writer proposed when the bank had nothing for an interest. For review. */
export const proposedWords = pgTable("proposed_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  word: text("word").notNull(),
  definition: text("definition").notNull(),
  interest: text("interest"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginTokens = pgTable("login_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => parents.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export type Parent = typeof parents.$inferSelect;
export type Child = typeof children.$inferSelect;
export type Routine = typeof routines.$inferSelect;
