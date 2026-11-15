import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/grand-hotel/400.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/bodoni-moda/500.css";
import "@fontsource/andika/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Reading Routine — 15 minutes of reading together, every day",
  description:
    "A nightly reading routine made for your child, created by a classroom teacher with 20 years of experience and a Master of Education in literacy. They read a book at their level to you, then you read them a bedtime story starring them. $10/month, 14-day free trial.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand" aria-label="The Reading Routine home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/clock-180.png" alt="" width={40} height={44} />
              <span>The Reading Routine</span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/#teacher">Made by a teacher</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/#why">Why it works</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/account">Sign in</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <span>© {new Date().getFullYear()} The Reading Routine · Made in Canada by a teacher · Your family&apos;s data is stored in Canada</span>
            <span>
              <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
