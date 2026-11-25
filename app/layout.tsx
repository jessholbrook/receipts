import type { Metadata } from "next";
import { shareMeta } from "@/lib/share";
import Link from "next/link";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./evidence-map.css";
import { Analytics } from "@vercel/analytics/next";
import TrackClicks from "@/components/TrackClicks";
import ThemeToggle from "@/components/ThemeToggle";
import { themeInitScript } from "@/lib/theme";

// One grotesque for everything, in the Swiss manner (Fred Troller's Geigy work set in Akzidenz).
// The mono face is kept only for code-like text: the moderator's JSON editor.
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans", display: "swap", weight: ["400", "500", "700", "800"] });
const code = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap" });

// Canonical address. The bare domain and whathasresearcheverdone.com redirect here.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.researchreceipts.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Receipts — What has UX research ever done for us?",
    template: "%s · Receipts",
  },
  description:
    "A public atlas of documented cases where UX research improved products, business metrics and decisions. Every entry rated for evidence strength.",
  ...shareMeta(
    "Receipts — What has UX research ever done for us?",
    "Documented UX research wins, rated for evidence strength. Filter by method, industry and metric.",
  ),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${code.variable}`} suppressHydrationWarning>
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
              receipts
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/about">about</Link>
              <Link href="/how-we-rate" className="nav-how">
                how we rate
              </Link>
              <Link href="/submit" className="nav-submit">
                <span className="nav-submit-mark" aria-hidden="true" />
                <span className="submit-long">submit a receipt</span>
                <span className="submit-short">submit</span>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <span className="footer-circle" aria-hidden="true" />
          <div className="wrap footer-cta">
            <p>
              know a case that belongs here? <Link href="/submit">submit a receipt.</Link>
            </p>
          </div>
          <div className="wrap">
            <span className="footer-domains">
              <a href="https://www.researchreceipts.org">researchreceipts.org</a> (aka{" "}
              <a href="https://whathasresearcheverdone.com">whathasresearcheverdone.com</a>): a public atlas of UX
              research wins
            </span>
            <span>
              <Link href="/about">about</Link> · <Link href="/how-we-rate">how we rate</Link> ·{" "}
              <Link href="/submit">submit</Link> ·{" "}
              <a href="https://github.com/jessholbrook/receipts">source</a>
            </span>
          </div>
        </footer>
        <Analytics />
        <TrackClicks />
      </body>
    </html>
  );
}
