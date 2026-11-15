export const metadata = { title: "Privacy — The Reading Routine" };

export default function Privacy() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: "40px 16px" }}>
      <h1 className="script" style={{ fontSize: 48 }}>
        Privacy
      </h1>
      <p className="muted">
        Draft for review by a lawyer before launch (PIPEDA, and Quebec&apos;s Law 25 if you serve families in Quebec).
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Your email address, first name, time zone and the delivery time you choose.</li>
        <li>
          About your child: first name, age, the pronouns to use in stories, interests, and the first names of the special people
          and pets you choose to add.
        </li>
        <li>Your child&apos;s reading level, placement and weekly check results, and the feedback you tap after reading.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        Only to make and send your child&apos;s daily reading routine and to keep their level right. We don&apos;t sell or share
        your information, and we never use your child&apos;s information for advertising.
      </p>
      <h2>Where it&apos;s kept</h2>
      <p>
        Your family&apos;s information is stored and processed in Canada: our database and website run in Canadian data centres,
        and emails are sent from Canada. Bedtime stories come from our own approved library, and your child&apos;s name,
        special people and pets are filled in on our own servers: your child&apos;s details are never sent to an AI. (Children
        who finish all 40 levels move on to chapter books, which are written by an AI model running in Canada: Claude, through
        Amazon Bedrock&apos;s Canada region.) Payments are handled by Stripe, which receives only your email address and payment details, never your
        child&apos;s information.
      </p>
      <h2>Your choices</h2>
      <p>
        You can update your child&apos;s details, pause or cancel anytime from your account. To delete your account and all of your
        child&apos;s information, email hello@thereadingroutine.ca and we&apos;ll delete it within 30 days.
      </p>
    </div>
  );
}
