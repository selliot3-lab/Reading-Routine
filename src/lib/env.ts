/**
 * Central place for configuration. Everything that touches children's data
 * is configured for Canadian regions (see README → "Canadian data residency").
 */
function opt(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  APP_URL: opt("APP_URL", "http://localhost:3000"),
  DATABASE_URL: opt("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/reading_routine"),
  /** Signs login sessions and one-click links. At least 32 random characters. */
  SESSION_SECRET: opt("SESSION_SECRET", "dev-only-secret-change-me-dev-only-secret"),
  CRON_SECRET: opt("CRON_SECRET", "dev-cron-secret"),
  ADMIN_EMAILS: opt("ADMIN_EMAILS")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  // Claude through Amazon Bedrock, Canada (Central)
  AWS_REGION: opt("AWS_REGION", "ca-central-1"),
  BEDROCK_MODEL_ID: opt("BEDROCK_MODEL_ID", "anthropic.claude-opus-5-5"),
  BEDROCK_FALLBACK_MODEL_ID: opt("BEDROCK_FALLBACK_MODEL_ID", "anthropic.claude-opus-4-8"),
  /** "bedrock" in production; "mock" writes a canned story so the app runs without AWS. */
  STORY_ENGINE: opt("STORY_ENGINE", "mock") as "bedrock" | "mock",

  // Email: Amazon SES in ca-central-1. "outbox" saves emails to ./.outbox instead.
  EMAIL_TRANSPORT: opt("EMAIL_TRANSPORT", "outbox") as "ses" | "outbox",
  EMAIL_FROM: opt("EMAIL_FROM", "The Reading Routine <hello@thereadingroutine.ca>"),

  // Stripe
  STRIPE_SECRET_KEY: opt("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: opt("STRIPE_WEBHOOK_SECRET"),
  STRIPE_PRICE_FIRST_CHILD: opt("STRIPE_PRICE_FIRST_CHILD"),
  STRIPE_PRICE_SIBLING: opt("STRIPE_PRICE_SIBLING"),
  TRIAL_DAYS: Number(opt("TRIAL_DAYS", "14")),
};

export const isStripeConfigured = () => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_FIRST_CHILD);
