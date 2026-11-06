import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
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
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="logo" aria-label="Receipts home">
              <span className="logo-mark" aria-hidden="true" />
              Receipts
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/" className="nav-browse">Browse</Link>
              <Link href="/about">How we rate</Link>
              <Link href="/submit" className="btn">
                Submit a win
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <span>
              <a href="https://www.researchreceipts.org">researchreceipts.org</a>: a public atlas of UX research wins,
              rated for evidence strength.
            </span>
            <span>
              <Link href="/about">Methodology</Link> · <Link href="/submit">Submit</Link> ·{" "}
              <a href="https://github.com/jessholbrook/receipts">Source</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
