export const metadata = { title: "Terms — The Reading Routine" };

export default function Terms() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "40px 16px" }}>
      <h1 className="script" style={{ fontSize: 48 }}>
        Terms
      </h1>
      <p className="muted">Draft for review by a lawyer before launch.</p>
      <ul>
        <li>The Reading Routine is $10 CAD a month for the first child and $8 CAD a month for each additional child ($2 off), after a 14-day free trial.</li>
        <li>You can cancel anytime from your account. You won&apos;t be charged if you cancel before your trial ends.</li>
        <li>Routines are for your family&apos;s personal use. Please don&apos;t resell or redistribute them.</li>
        <li>
          Bedtime stories are written by AI and checked automatically, but please read with your child as you normally would. If
          anything in a story seems wrong, tell us at hello@thereadingroutine.ca.
        </li>
      </ul>
    </div>
  );
}
