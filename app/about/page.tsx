import Link from "next/link";
import type { Metadata } from "next";
import { EVIDENCE, SOURCE_TYPES } from "@/lib/taxonomy";
import { EvidenceBadge } from "@/components/EntryCard";
import type { Entry } from "@/lib/types";

export const metadata: Metadata = { title: "How we rate evidence" };

export default function About() {
  return (
    <div className="wrap">
      <div className="prose">
        <h1>How we rate the receipts</h1>
        <p>
          Most published &ldquo;research wins&rdquo; are case studies written to make someone look good. That doesn&rsquo;t
          make them false. It does mean you should know what you&rsquo;re looking at before you cite one in a budget
          meeting.
        </p>
        <p>
          So every entry gets two labels: how strong the <strong>evidence</strong> is, and who&rsquo;s{" "}
          <strong>telling the story</strong>.
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
          A redesign that improved conversion isn&rsquo;t automatically a research win. Each entry spells out what the
          research found, what changed because of it, and how directly the source ties the outcome to the research. If
          the link is loose, the <em>Attribution</em> and <em>Caveats</em> sections say so.
        </p>

        <h2>Ground rules</h2>
        <ul>
          <li>Every seed entry links to at least one public source we opened and checked.</li>
          <li>Entries are summaries in our own words. Go to the source for the full story.</li>
          <li>Numbers are quoted exactly as the source reports them. We don&rsquo;t extrapolate.</li>
          <li>Community submissions are reviewed before they appear. Anonymized entries are allowed.</li>
        </ul>

        <h2>Found a mistake?</h2>
        <p>
          <a href="https://github.com/jessholbrook/receipts/issues/new">Open an issue</a> with the correction and a
          source. Or <Link href="/submit">submit a win</Link> of your own.
        </p>
      </div>
    </div>
  );
}
