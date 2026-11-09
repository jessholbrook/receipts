import Link from "next/link";
import type { Metadata } from "next";
import { shareMeta } from "@/lib/share";
import { EVIDENCE, SOURCE_TYPES } from "@/lib/taxonomy";
import { EvidenceBadge } from "@/components/EntryCard";
import type { Entry } from "@/lib/types";

export const metadata: Metadata = {
  title: "How we rate evidence",
  description: "The four evidence levels behind every receipt, from controlled experiments to changed decisions.",
  ...shareMeta(
    "How Receipts rates evidence",
    "Tested, Measured, Reported or Decision: the four evidence levels, and why vendor accounts are flagged.",
  ),
};

export default function About() {
  return (
    <div className="wrap">
      <div className="prose">
        <h1>How we rate the receipts</h1>
        <p>
          Published case studies vary widely in how much evidence they include. Some report controlled experiments.
          Others report an outcome without saying how it was measured. Many are written by the team, agency or vendor
          that did the work.
        </p>
        <p>
          To make that visible, every entry has two labels: the <strong>strength of the evidence</strong>, and the{" "}
          <strong>type of source</strong> it comes from.
        </p>

        <h2>Evidence strength</h2>
        <div className="ev-table">
          {EVIDENCE.map((e) => (
            <div className="ev-row" key={e.value}>
              <span>
                <EvidenceBadge level={e.value as Entry["evidence_strength"]} />
              </span>
              <span>{e.description}</span>
            </div>
          ))}
        </div>
        <p>
          When a case sits between two levels, we pick the lower one. &ldquo;Decision&rdquo; isn&rsquo;t a weaker
          category. It&rsquo;s a different kind of win: the expensive thing that didn&rsquo;t get built. Those rarely come
          with a number, and they&rsquo;re often research&rsquo;s biggest payoff.
        </p>

        <h2>Source type</h2>
        <div className="ev-table">
          {SOURCE_TYPES.map((s) => (
            <div className="ev-row" key={s.value}>
              <strong style={{ fontSize: 14 }}>{s.label}</strong>
              <span>{s.description}</span>
            </div>
          ))}
        </div>

        <h2>Attribution</h2>
        <p>
          Each entry spells out what the research found, what changed because of it, and how directly the source ties
          the outcome to the research. If the connection is tenuous, the <em>Attribution</em> and <em>Caveats</em>{" "}
          sections say so.
        </p>

        <h2>Ground rules</h2>
        <ul>
          <li>
            Every entry based on a published case links to at least one public source we opened and checked.
            Community submissions without a public source are labeled as such.
          </li>
          <li>Entries are summaries of the research. Go to the source for the full story.</li>
          <li>Evidence, numbers, and metrics are quoted exactly as the source reports them.</li>
          <li>Community submissions are reviewed before they appear. Anonymized entries are allowed.</li>
        </ul>

        <h2>Found a mistake?</h2>
        <p>
          <a href="https://github.com/jessholbrook/receipts/issues/new">Open an issue</a> with the correction and a
          source. Or <Link href="/submit">submit a receipt</Link> of your own.
        </p>

        <h2>Cite it, share it</h2>
        <p>
          Receipts lives at <a href="https://www.researchreceipts.org">researchreceipts.org</a>. Every entry has its own
          link with a preview card, so you can drop a single receipt into a deck, a doc or a budget thread. For the
          skeptic in your life, <a href="https://whathasresearcheverdone.com">whathasresearcheverdone.com</a> gets you
          here too.
        </p>
      </div>
    </div>
  );
}
