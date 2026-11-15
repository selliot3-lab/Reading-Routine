# The Reading Routine

A daily 15-minute reading routine for families. Each day at a time the parent picks, they get an email with a PDF (print it or flip through it on a phone):

1. **They read to you** (about 5 min): a short decodable picture book at the child's level, using only the sounds they've been taught.
2. **Spark Words** (about 2 min): three new vocabulary words, each with a picture, a kid-friendly meaning and a little activity, plus the clap signal.
3. **You read to them** (about 8 min): a new bedtime story starring the child, their special people and pets, built around their interests. Each Spark Word appears at least three times. It winds down gently for sleep.
4. **Tell us how it went**: one tap (too hard, just right or too easy) and a weekly 10-word check keep the level right.

After Level 40, children "graduate": each day they read a chapter of an ongoing book (starring them) to the parent, with Spark Words and a talk question.

$10 CAD/month for the first child, $8 for each sibling ($2 off), 14-day free trial.

## How it's built

| Piece | Where |
| --- | --- |
| Website, sign-up, account | Next.js (App Router), `src/app` |
| 40 levels (from the scope & sequence) | `content/levels.json`, `src/lib/curriculum.ts` |
| Decodable reader library | `content/readers.json`, checked by `npm run content:check` |
| Spark Word bank (17 interests) | `content/spark-words.json` |
| Story writer | Claude on Amazon Bedrock (Canada), `src/lib/story/` |
| Daily PDF | `@react-pdf/renderer`, `src/lib/pdf/RoutinePdf.tsx` |
| Scheduler | Vercel Cron every 15 min → `src/app/api/cron/dispatch` → `src/lib/routine.ts` |
| Email | Amazon SES (ca-central-1), `src/lib/email.ts`, `src/lib/emails.ts` |
| Database | Postgres (Supabase, Canada), Drizzle ORM, `src/lib/db/schema.ts` |
| Payments | Stripe Checkout + Billing Portal + webhook |
| Sign-in | Emailed single-use link → 30-day session cookie |

### Canadian data residency

Everything that touches a child's information stays in Canadian regions:

- **Website and server code:** Vercel, Montréal region (`yul1`, set in `vercel.json`).
- **Database:** Supabase project in **Canada (Central)**.
- **Story writing:** Claude through **Amazon Bedrock in ca-central-1**. Use a Canada-only cross-region inference profile if one is offered for your model, so requests aren't routed to the US when Canadian capacity is short. Check the Bedrock console for the exact model or profile ID and set `BEDROCK_MODEL_ID`.
- **Email:** Amazon SES in **ca-central-1**.
- **Stripe** receives only the parent's email and payment details, never the child's information.

Ask Vercel about where logs and metadata are kept, and have a lawyer review the privacy policy (PIPEDA; Quebec's Law 25 if you serve Quebec).

## Run it locally

You need Node 20+ and Postgres.

```bash
npm install
cp .env.example .env          # the defaults run without AWS or Stripe
createdb reading_routine
npm run db:migrate
npm run dev                   # http://localhost:3000
```

With the defaults, stories are placeholders (`STORY_ENGINE=mock`), emails and PDFs are saved to `./.outbox/` instead of being sent, and sign-up skips Stripe and starts the trial directly.

Useful commands:

```bash
npm run preview -- --level 5   # builds a sample routine PDF into .outbox/
npm run dispatch               # runs the scheduler once, like the cron
npm run content:check          # checks every reader is decodable at its level
npm test                       # unit tests
```

## Going live

1. **Supabase:** create a project in Canada (Central). Put its pooler connection string in `DATABASE_URL`, then run `npm run db:migrate`.
2. **AWS (ca-central-1):**
   - Enable Claude model access in Amazon Bedrock and set `BEDROCK_MODEL_ID`.
   - Verify your sending domain in SES and request production access.
   - Create an IAM user or role allowed to call Bedrock and SES, and set its keys.
   - Set `STORY_ENGINE=bedrock` and `EMAIL_TRANSPORT=ses`.
3. **Stripe:**
   - Run `STRIPE_SECRET_KEY=... npm run stripe:setup` to create the prices.
   - Add a webhook to `/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.*` events.
   - Turn on the Billing Portal.
4. **Vercel:**
   - Import the repo and add the environment variables.
   - The cron in `vercel.json` runs every 15 minutes, which needs a Pro plan (Hobby only allows daily crons).

## Content still to do

- **Decodable readers:** Levels 1–6 have 3 or 4 books each. Every book is a title plus exactly 6 pages, the inside of the fold-up little book; the back cover holds "The End, I read it!" and the sign-off line. The words are in a review doc for the founder to check. Levels without books fall back to the nearest lower level. Draft more with `npm run content:readers -- --level 7 --count 8`, which keeps only 6-page drafts that pass the decodability check.
- **Pictures:** each book page gets a black-and-white outline picture the child can colour (`picture` is null until it's made; `pictureBrief` says what it shows). These are made after the words are approved. On long pages the picture shrinks, and on very long pages the words take the whole page.
- **Spark Words:** 104 words across 17 interests. Review the definitions and tips. When the bank runs out for a child, the story writer suggests new words; they're saved in the `proposed_words` table for review.
- **Heart-word order:** check it against the UFLI manual (an open item in the scope & sequence doc). Also check UFLI's terms before naming UFLI in marketing. The site currently says "a proven, structured phonics sequence".
