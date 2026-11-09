import type { Metadata } from "next";
import Link from "next/link";
import { Newsreader, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import TrackClicks from "@/components/TrackClicks";
import ThemeToggle from "@/components/ThemeToggle";
import { themeInitScript } from "@/lib/theme";

// Newsreader's optical-size axis gives display cuts at headline sizes, text cuts on card titles.
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap", axes: ["opsz"] });
const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Canonical address. The bare domain and whathasresearcheverdone.com redirect here.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.researchreceipts.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  twitter: { card: "summary_large_image" },
  title: {
    default: "Receipts — What has UX research ever done for us?",
    template: "%s · Receipts",
  },
  description:
    "A public atlas of documented cases where UX research improved products, business metrics and decisions. Every entry rated for evidence strength.",
  openGraph: {
    title: "Receipts — What has UX research ever done for us?",
    description: "Documented UX research wins, rated for evidence strength. Filter by method, industry and metric.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="logo" aria-label="Receipts home">
              <span className="logo-mark" aria-hidden="true" />
              Receipts
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/about">About</Link>
              <Link href="/how-we-rate" className="nav-how">
                How we rate
              </Link>
              <Link href="/submit" className="btn">
                <span className="submit-long">Submit a win</span>
                <span className="submit-short">Submit</span>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <div className="wrap">
            <span className="footer-domains">
              <a href="https://www.researchreceipts.org">researchreceipts.org</a> (aka{" "}
              <a href="https://whathasresearcheverdone.com">whathasresearcheverdone.com</a>): a public atlas of UX
              research wins
            </span>
            <span>
              <Link href="/about">About</Link> · <Link href="/how-we-rate">How we rate</Link> ·{" "}
              <Link href="/submit">Submit</Link> ·{" "}
              <a href="https://github.com/jessholbrook/receipts">Source</a>
            </span>
          </div>
        </footer>
        <Analytics />
        <TrackClicks />
      </body>
    </html>
  );
}
