import Link from "next/link";

export default function Welcome() {
  return (
    <div className="stripes" style={{ padding: "48px 0", minHeight: "60vh" }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="kicker">15 mins / day</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/clock-180.png" alt="" width={90} height={100} style={{ marginTop: 12 }} />
          <h1 className="script" style={{ fontSize: 48 }}>
            You&apos;re all set!
          </h1>
          <p>
            Your first reading routine arrives today at the time you chose. We&apos;ve also emailed you a link to your account, where
            you can change the time, update interests or pause anytime.
          </p>
          <p className="muted small">Tip: add hello@thereadingroutine.ca to your contacts so each day&apos;s routine never lands in spam.</p>
          <Link className="btn" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
