import type { Metadata } from "next";
import Link from "next/link";
import { LiteracyMap } from "../LiteracyMap";
import s from "./research.module.css";

export const metadata: Metadata = {
  title: "The research behind every page — The Reading Routine",
  description:
    "The Reading Routine is built on the science of how children learn to read: family literacy, structured phonics, fluency, vocabulary and comprehension research.",
};

const COVERAGE = [
  {
    part: "Oral language",
    how: "The nightly read-aloud story, a question before reading and an open-ended talk question after it.",
  },
  {
    part: "Phonological awareness",
    how: "A one-minute sound warm-up with “robot talk” (blending and segmenting) and a pre-reading book of each level's new sounds.",
  },
  {
    part: "Decoding",
    how: "A little decodable book every night, written only with the letter sounds your child has been taught, across 40 sequenced levels.",
  },
  {
    part: "Fluency",
    how: "Each book is read three ways (they sound it out, you read it together, they read it alone) and books come back for rereading.",
  },
  {
    part: "Vocabulary",
    how: "Three Spark Words a night: a friendly definition, a picture, an activity, then repeated use in a story made for your child.",
  },
  {
    part: "Reading comprehension",
    how: "Prediction before the story and Text Talk questions after it that ask children to think, not just recall.",
  },
  {
    part: "Morphology",
    how: "The upper levels teach prefixes, suffixes and spelling changes: un + lock, help + ful, hop + p + ing.",
  },
  {
    part: "Writing",
    how: "Children sign and date every book they read, draw their favourite part, and colour pictures that match the words.",
  },
];

const EVIDENCE: { title: string; quote: string; cite: string; why: string; paraphrase?: boolean }[] = [
  {
    title: "Home is where reading grows",
    quote:
      "Research has demonstrated that literacy-rich home environments contribute more powerfully to children's early successful literacy development than do excellent preschool and kindergarten classrooms.",
    cite: "Tracey & Morrow, 2017, p. 97",
    why: "The Reading Routine brings that literacy-rich time home, every day, with no teaching background needed.",
  },
  {
    title: "Reading more makes reading easier",
    quote:
      "A positive dimension of our research is that all of our studies have demonstrated that reading yields significant dividends for everyone — not just for the “smart kids” or the more able readers.",
    cite: "Cunningham & Stanovich, 1998, p. 7",
    why: "Children who fall behind early tend to read less, which widens the gap (the “Matthew effect”). A daily routine keeps every child reading, at the right level.",
  },
  {
    title: "Stories are full of rich words",
    quote: "Children's books have 50 percent more rare words in them than does adult prime-time television and the conversation of college graduates.",
    cite: "Cunningham & Stanovich, 1998, p. 3",
    why: "That's why a parent reads a full story aloud every night, well above what your child can read on their own.",
  },
  {
    title: "Words need meaning, context and repetition",
    quote:
      "First, vocabulary knowledge is a network of connected concepts; second, vocabulary is learned from context, but context is an inefficient learning medium; and third, learning is incremental.",
    cite: "O'Connor & Vadasy, 2011, p. 140",
    why: "So Spark Words get a friendly definition and picture first, appear at least three times in the story, and come back two and four weeks later.",
  },
  {
    title: "Noticing words is a skill",
    quote: "Word consciousness involves being aware and interested in words and word meanings and noticing when and how new words are used.",
    cite: "Lane & Allen, 2010, p. 365",
    why: "Clapping for Spark Words turns listening for new words into a game children love.",
  },
  {
    title: "Introduce key ideas first",
    quote: "People learn more deeply when the names and characteristics of key ideas are introduced before the lesson.",
    cite: "Mayer, 2014, p. 318 (the pre-training principle)",
    paraphrase: true,
    why: "Spark Words are introduced before the story, so children already have a hook to hang each word on when they hear it.",
  },
  {
    title: "Sounding out is how children teach themselves",
    quote: "When readers see an unfamiliar word, they can try to read it by sounding out the individual letters and blending them.",
    cite: "Cain, 2010, p. 70",
    why: "Every little book uses only the sounds your child has been taught, so they can decode every word instead of guessing.",
  },
  {
    title: "Fluency is the bridge to understanding",
    quote: "Fluency has been described as the bridge from phonics to comprehension.",
    cite: "Pikulski & Chard, 2005, as cited in Rasinski, 2011, p. 94",
    why: "Rereading the same short text, first with support and then alone, builds the automatic, expressive reading that frees up attention for meaning.",
  },
  {
    title: "Talking about the story matters",
    quote:
      "The number of questions asked by parents before and after reading; the number of high-level, critical thinking questions asked by parents; and the amount of positive feedback given to the child.",
    cite: "Flood, 1977; Tracey & Morrow, 2002, as cited in Tracey & Morrow, 2017, p. 97",
    why: "These parent behaviours predicted children's literacy growth. Every routine gives you a question before the story, a thinking question after it, and a reminder to praise their effort.",
  },
  {
    title: "Ask why, not just what",
    quote: "Initial questions may not bring forth meaningful responses from young children. Yet simply asking more questions may not necessarily prompt richer comments.",
    cite: "Beck & McKeown, 2001, p. 16 (Text Talk)",
    why: "Our talk questions are open-ended (why, how, what if) and come with simple follow-ups: repeat what they said, reread the part, ask “what does that mean?”",
  },
  {
    title: "Drawing deepens learning",
    quote: "Asking students to create drawings while reading text causes generative processing that leads to better learning outcomes.",
    cite: "Mayer, 2014, p. 433 (the drawing principle)",
    why: "Every page of the little book has a picture to colour, and pre-reading books pair each sound with a picture.",
  },
  {
    title: "Less clutter, more learning",
    quote: "People learn more deeply from a multimedia message when extraneous material is excluded rather than included.",
    cite: "Mayer, 2014, p. 280 (the coherence principle)",
    why: "No points, shops, games or ads to distract from reading. In our founder's review of a popular reading app, children spent much of their time shopping for rewards instead of reading.",
  },
  {
    title: "Little and often beats cramming",
    quote: "We learn better when we spread out practice time. The same amount of overall time is more effective when it is spread out in small bits.",
    cite: "Hattie & Yates, 2013",
    paraphrase: true,
    why: "Attention starts to drift after about 15 to 20 minutes, so the routine is 15 minutes a day, every day, not an hour on the weekend.",
  },
  {
    title: "Structured, explicit and repeated",
    quote: "Teach skills explicitly and directly, in a logical, progressive sequence, with repeated practice and step-by-step routines that lighten the load on working memory.",
    cite: "Recommended strategies for struggling readers, Reading Rockets",
    paraphrase: true,
    why: "The same principles that help struggling and dyslexic readers help every child: one new skill at a time, practised every day, checked every week.",
  },
];

const REFERENCES = [
  "Beck, I. L., & McKeown, M. G. (2001). Text talk: Capturing the benefits of read-aloud experiences for young children. The Reading Teacher, 55, 10–20.",
  "Cain, K. (2010). Reading development and difficulties. BPS Blackwell/John Wiley.",
  "Cunningham, A. E., & Stanovich, K. E. (1998). What reading does for the mind. American Educator, 22(1–2), 8–15.",
  "Hattie, J., & Yates, G. C. R. (2013). Visible learning and the science of how we learn. Routledge.",
  "Lane, H. B., & Allen, S. A. (2010). The vocabulary-rich classroom: Modeling sophisticated word use to promote word consciousness and vocabulary growth. The Reading Teacher, 63(5), 362–370.",
  "Mayer, R. E. (Ed.). (2014). The Cambridge handbook of multimedia learning (2nd ed.). Cambridge University Press.",
  "O'Connor, R. E., & Vadasy, P. F. (2011). Handbook of reading interventions. The Guilford Press.",
  "Rasinski, T. (2011). Reading fluency: What it is and what it is not. In S. J. Samuels & A. E. Farstrup (Eds.), What research has to say about reading instruction (4th ed., pp. 94–114). International Reading Association.",
  "Stanovich, K. E. (1986). Matthew effects in reading: Some consequences of individual differences in the acquisition of literacy. Reading Research Quarterly, 22, 360–407.",
  "Tracey, D. H., & Morrow, L. M. (2017). Lenses on reading: An introduction to theories and models (3rd ed.). The Guilford Press.",
];

export default function Research() {
  return (
    <>
      <section className={`${s.hero} stripes`}>
        <div className="container">
          <div className={`card ${s.heroCard}`}>
            <div className="kicker">research-backed · evidence-based</div>
            <h1>The research behind every page</h1>
            <p>
              The Reading Routine was designed by a classroom teacher with 20 years of experience and a Master of Education focused
              on literacy. Every part of the routine comes from what research says about how children learn to read, and how
              families help them.
            </p>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className="container">
          <h2>How reading grows</h2>
          <p className={s.lede}>
            Learning to read isn&apos;t one skill: it&apos;s eight that build on each other. This map, from our founder&apos;s
            master&apos;s work, shows how oral language, sounds, decoding, fluency, vocabulary, word parts, writing and comprehension
            connect.
          </p>
          <LiteracyMap />
          <p className="small muted" style={{ textAlign: "center", marginTop: 8 }}>
            On a phone, scroll sideways to see the whole map.
          </p>
        </div>
      </section>

      <section className={s.section}>
        <div className="container">
          <h2>Every part of the map, every night</h2>
          <p className={s.lede}>Most programs focus on one or two of these. The Reading Routine touches all eight in 15 minutes.</p>
          <div className={s.coverage}>
            {COVERAGE.map((c) => (
              <div key={c.part}>
                <h3>{c.part}</h3>
                <p>{c.how}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className="container">
          <h2>Why each part works</h2>
          <div className={s.evidence}>
            {EVIDENCE.map((e) => (
              <article key={e.title}>
                <h3>{e.title}</h3>
                <blockquote>{e.paraphrase ? e.quote : <>&ldquo;{e.quote}&rdquo;</>}</blockquote>
                <p className={s.cite}>{e.cite}</p>
                <p className={s.why}>{e.why}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className="container" style={{ maxWidth: 820 }}>
          <h2>References</h2>
          <ul className={s.refs}>
            {REFERENCES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/start" className="btn">
              Start your 14-day free trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
