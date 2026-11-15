import Link from "next/link";
import s from "./page.module.css";

const research = [
  {
    title: "A nightly routine helps children sleep",
    body: "In a survey of about 10,000 mothers in 14 countries, young children with a bedtime routine every night fell asleep faster, woke less and slept longer. The more nights a week families kept their routine, the better children slept.",
    source: "Mindell et al., Sleep, 2015",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4402657",
  },
  {
    title: "Reading together brings you closer",
    body: "In a randomized trial with 293 families, sharing books with babies was linked to more parental warmth and less parenting stress a year later. In another study, reading together at age one went with less harsh parenting at age three.",
    source: "Canfield et al., Developmental Psychology, 2020; J. Developmental & Behavioral Pediatrics, 2019",
    href: "https://reachoutandread.org/canfield_2020_beyond-language-impacts-of-shared-reading-on-parenting-stress-and-early-parent-child-relational-health",
  },
  {
    title: "A story a day adds up to a lot of words",
    body: "Researchers at Ohio State estimated that reading one picture book a day exposes a child to about 290,000 more words by age five than a child who isn't read to.",
    source: "Logan et al., J. Developmental & Behavioral Pediatrics, 2019",
    href: "https://www.sciencedaily.com/releases/2019/04/190404074947.htm",
  },
  {
    title: "Explaining a word first helps it stick",
    body: "When adults briefly explained word meanings during repeated story reading, children learned nearly twice as many new words (22% vs 12%), and kept them weeks later. Children need to meet a word many times to learn it, so Spark Words come back two and four weeks later.",
    source: "Biemiller & Boote, Journal of Educational Psychology, 2006",
    href: "https://www.readingrockets.org/article/vocabulary-development-during-read-alouds-primary-practices",
  },
  {
    title: "Stories about them teach more",
    body: "Preschoolers knew more about new words from the parts of a book that were personalized to them than from the parts that weren't. Every bedtime story stars your child, with their people, pets and favourite things.",
    source: "Kucirkova, Messer & Sheehy, First Language, 2014",
    href: "https://oro.open.ac.uk/40613",
  },
  {
    title: "Books they can sound out build real readers",
    body: "Decodable books use only the letter sounds a child has been taught, so they practise sounding words out instead of guessing. Your child's book always matches their level, and moves up when they're ready.",
    source: "Reading Rockets: decodable books",
    href: "https://www.readingrockets.org/classroom/choosing-and-using-texts/decodable-books",
  },
];

const faqs = [
  {
    q: "Is this another app or screen for my child?",
    a: "No. There's nothing for your child to download or tap. Each day's routine is a PDF you print, so your child reads a real little book. If you can't print, you can open it on your phone or tablet and read it together, but there are no games, ads or autoplay.",
  },
  {
    q: "Who made The Reading Routine?",
    a: "A mom and classroom teacher with 20 years of experience and a Master of Education focused on literacy, who built the routine she wished she had for her own kids. The levels, the little books and the Spark Words are all built on the same structured approach used to teach reading in schools, and every book is reviewed by a teacher before it reaches your child.",
  },
  {
    q: "What ages is it for?",
    a: "Children who are learning to read, usually around ages 4 to 8. Levels are set by what your child can do, not by age or grade: a short placement check at sign-up finds where to start.",
  },
  {
    q: "Do I have to print it?",
    a: "No. Each day's routine is a PDF you can print or flip through on a phone or tablet, whichever is easier that night.",
  },
  {
    q: "How long does it take?",
    a: "About 15 minutes: around 5 minutes for your child to read to you, 2 for the Spark Words and 8 for the bedtime story.",
  },
  {
    q: "What happens when my child finishes all 40 levels?",
    a: "The routine keeps going. Graduates get a chapter of an ongoing book every day, starring them, which they read aloud to you. The focus moves to fluency and vocabulary, and you still read together.",
  },
  {
    q: "How does it know if the level is right?",
    a: "After each routine you tap Too hard, Just right or Too easy. Once a week there's a quick 10-word check. Your child moves up, stays or steps back based on both.",
  },
  {
    q: "Where is my child's information kept?",
    a: "In Canada. Your child's name, interests and stories are stored and processed on Canadian servers. Payments are handled by Stripe, which never sees your child's details.",
  },
  {
    q: "Can I use it for more than one child?",
    a: "Yes. Each child gets their own level, books and stories. The first child is $10 a month and each brother or sister is $8 ($2 off).",
  },
];

export default function Home() {
  return (
    <>
      <section className={`${s.hero} stripes`}>
        <div className="container">
          <div className={`card ${s.heroCard}`}>
            <div className="kicker">15 mins / day</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/clock-360.png" alt="A vintage alarm clock standing on an open book" width={120} height={133} />
            <h1>The Reading Routine</h1>
            <p className={s.lede}>
              A bedtime reading routine made for your child. They read a little book to you. You read them a story starring them.
              Fifteen cozy minutes, every day. No apps, no screens: just you, your child and a book.
            </p>
            <div className={s.cta}>
              <Link href="/start" className="btn">
                Start your 14-day free trial
              </Link>
              <Link href="#how" className="btn btn-ghost">
                See how it works
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 14 }}>
              Then $10 a month. Cancel anytime.
            </p>
            <p className={s.teacherBadge}>
              Created by a mom and classroom teacher with 20 years&apos; experience and a Master of Education in literacy
            </p>
          </div>
        </div>
      </section>

      <section className={s.section} id="teacher">
        <div className="container">
          <div className={s.teacher}>
            <div>
              <div className="kicker">who made this</div>
              <h2 className={s.left}>Built by a teacher and a mom</h2>
              <p>
                The Reading Routine was created by a classroom teacher with <strong>20 years of experience</strong> and a{" "}
                <strong>Master of Education focused on literacy</strong>, who is also a mom. After two decades of watching what
                actually turns children into confident readers, the answer was never a flashy app. It&apos;s a grown-up and a
                child, side by side, reading a little every day.
              </p>
              <blockquote className={s.note}>
                <p>
                  &ldquo;I know I should read with my kids every day. I teach reading for a living! But at the end of a long day,
                  even I find it hard to fit in. And finding books at just the right level, ones my kids can actually read on
                  their own, takes time I don&apos;t have.
                </p>
                <p>
                  So I built the thing I wanted: tonight&apos;s reading, already done for me, at exactly the right level, waiting in
                  my inbox. All I have to do is sit down and read with them.&rdquo;
                </p>
                <footer>— Founder of The Reading Routine, teacher and mom</footer>
              </blockquote>
              <p>
                It&apos;s the same structured, step-by-step approach used to teach reading in classrooms, made simple enough for any
                parent to do at bedtime, with no teaching background and no prep.
              </p>
              <ul className={s.teacherList}>
                <li>Every level follows a proven structured phonics sequence, in the order children actually learn to read.</li>
                <li>Every little book uses only the sounds your child has been taught, so they read it, not guess it.</li>
                <li>Every Spark Word is chosen and explained the way a teacher would introduce it in class.</li>
                <li>Every book in the library is reviewed by a teacher before it reaches your child.</li>
              </ul>
            </div>
            <div className={s.creds}>
              <div>
                <strong>20</strong>
                years in the classroom
              </div>
              <div>
                <strong>M.Ed.</strong>
                Master of Education, literacy focus
              </div>
              <div>
                <strong>40</strong>
                carefully sequenced phonics levels
              </div>
              <div>
                <strong>0</strong>
                apps to download
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={s.section} id="how">
        <div className="container">
          <h2>How it works</h2>
          <p className={s.sectionLede}>Set it up once. Then every day, tonight&apos;s reading is waiting in your inbox.</p>
          <ol className={`${s.steps} grid-2`}>
            <li>
              <h3>Tell us about your child</h3>
              <p>Their name, age and what they love: dinosaurs, hockey, fairies, bugs. Add the special people and pets who might star in their stories.</p>
            </li>
            <li>
              <h3>A 5-minute reading check</h3>
              <p>Your child reads a few words aloud while you tap. We start them at the right level, from first letter sounds to advanced patterns.</p>
            </li>
            <li>
              <h3>Pick your time</h3>
              <p>Choose when the email arrives, like just before dinner. Each day&apos;s routine comes as a PDF to print or read on your phone.</p>
            </li>
            <li>
              <h3>Read, clap, and tell us how it went</h3>
              <p>One tap after reading (too hard, just right or too easy) and a quick weekly check keep your child at the right level.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className={s.section}>
        <div className="container">
          <h2>Tonight&apos;s routine</h2>
          <p className={s.sectionLede}>Three parts, about fifteen minutes, start to finish.</p>
          <div className={s.tonight}>
            <div>
              <div className={s.mins}>5 MIN</div>
              <h3>They read to you</h3>
              <p>A short picture book written only with the sounds your child has learned so far, so they can really read it.</p>
              <div className={s.readerSample}>The pup dug in the mud.</div>
            </div>
            <div>
              <div className={s.mins}>2 MIN</div>
              <h3>Spark Words</h3>
              <p>Meet three new words with a picture, a simple meaning and a little activity. Then the challenge: clap whenever you hear one in the story.</p>
              <div className={s.sparkSample}>
                <strong>enormous</strong>
                Very, very big.
              </div>
            </div>
            <div>
              <div className={s.mins}>8 MIN</div>
              <h3>You read to them</h3>
              <p>A brand-new bedtime story starring your child, their friends, family and pets. Fun in the middle, calm at the end, ready for sleep.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={s.section} id="screen-free">
        <div className="container">
          <h2>Real books, not another app</h2>
          <p className={s.sectionLede}>
            Kids already have plenty of screens. The Reading Routine isn&apos;t one more. There&apos;s nothing for your child to
            download, tap or log in to.
          </p>
          <div className="grid-3">
            <div className={s.point}>
              <h3>A book in their hands</h3>
              <p>Print tonight&apos;s routine and your child reads a real little book, turning real pages, on your lap.</p>
            </div>
            <div className={s.point}>
              <h3>Nothing to keep them hooked</h3>
              <p>No ads, games, points or autoplay. Just a story, read together, that ends with lights out.</p>
            </div>
            <div className={s.point}>
              <h3>A screen-free wind-down</h3>
              <p>
                Reading on paper fits the Canadian Paediatric Society&apos;s advice to avoid screens for at least an hour before
                bed.{" "}
                <a href="https://cps.ca/uploads/tools/CPS_ScreenTime-EN.pdf" target="_blank" rel="noreferrer">
                  CPS
                </a>
              </p>
            </div>
          </div>
          <div className={s.callout}>
            <strong>Why print matters:</strong> in a Pediatrics study, parents and toddlers talked and worked together more when
            reading a print book than the same story as an e-book. With e-books, more of the talk was about the device
            itself.{" "}
            <a href="https://www.sciencedaily.com/releases/2019/03/190325080459.htm" target="_blank" rel="noreferrer">
              Munzer et al., Pediatrics, 2019
            </a>
          </div>
          <p className="small muted" style={{ textAlign: "center", marginTop: 16 }}>
            Can&apos;t print tonight? The PDF also opens on your phone or tablet, with you holding it and reading together.
          </p>
        </div>
      </section>

      <section className={`${s.section} stripes`}>
        <div className="container">
          <div className={s.quote}>
            <div className="kicker" style={{ textAlign: "center", marginBottom: 10 }}>
              from a sample story
            </div>
            <p>
              Maya pressed her ear to the cold rock. &quot;Nana,&quot; she whispered, &quot;I think this is a <u>fossil</u>.&quot;
              Biscuit sniffed it and sneezed. It was <u>enormous</u>, bigger than the whole picnic blanket.
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              Every story stars your child, uses tonight&apos;s three Spark Words at least three times each, and winds down gently for
              sleep.
            </p>
          </div>
        </div>
      </section>

      <section className={s.section} id="why">
        <div className="container">
          <h2>Why a routine works</h2>
          <p className={s.sectionLede}>
            It isn&apos;t about one perfect night. It&apos;s fifteen minutes, again and again. Here&apos;s what the research says.
          </p>
          <div className={s.research}>
            {research.map((r) => (
              <article key={r.title}>
                <h3>{r.title}</h3>
                <p style={{ margin: 0 }}>{r.body}</p>
                <p className={s.source}>
                  <a href={r.href} target="_blank" rel="noreferrer">
                    {r.source}
                  </a>
                </p>
              </article>
            ))}
          </div>
          <p className="small muted" style={{ textAlign: "center", marginTop: 24 }}>
            The Canadian Paediatric Society encourages families to read with children every day and to make story time a cuddly,
            shared moment.{" "}
            <a href="https://cps.ca/documents/position/read-speak-sing-promoting-literacy" target="_blank" rel="noreferrer">
              Read, Speak, Sing (2021)
            </a>
          </p>
        </div>
      </section>

      <section className={s.section}>
        <div className="container">
          <h2>40 levels, then chapter books</h2>
          <p className={s.sectionLede}>
            Designed by a literacy specialist. Every level follows a proven, structured phonics sequence, so each little book
            only uses sounds your child has been taught.
          </p>
          <div className={s.levels}>
            <div>
              <strong>1–12</strong>
              Letter sounds and short-vowel words: <em>sat, pin, stomp</em>
            </div>
            <div>
              <strong>13–24</strong>
              Letter teams, silent e, endings: <em>ship, cake, jumping</em>
            </div>
            <div>
              <strong>25–40</strong>
              Vowel teams and bigger words: <em>rain, night, kindness</em>
            </div>
            <div>
              <strong>40+</strong>
              A chapter a day they read to you, starring them
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.section} stripes`} id="pricing">
        <div className="container">
          <div className={`card ${s.priceCard}`}>
            <div className="kicker">pricing</div>
            <div className={s.price}>$10</div>
            <div>per month, CAD</div>
            <ul className={s.priceList}>
              <li>14-day free trial, cancel anytime</li>
              <li>A new routine every day, at the time you choose</li>
              <li>Bedtime stories starring your child</li>
              <li>Add a brother or sister for $8/month ($2 off)</li>
            </ul>
            <Link href="/start" className="btn">
              Start your free trial
            </Link>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h2>Questions</h2>
          <div className={s.faq}>
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
