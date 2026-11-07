import Link from "next/link";
import type { Entry } from "@/lib/types";
import { labelFor } from "@/lib/taxonomy";

export function EvidenceBadge({ level }: { level: Entry["evidence_strength"] }) {
  return <span className={`ev ev-${level}`}>{labelFor("evidence_strength", level)}</span>;
}

const SOURCE_SHORT: Record<Entry["source_type"], string> = {
  first_party: "Company's own account",
  agency_vendor: "Agency or vendor account",
  independent: "Independent source",
  community: "Community submission",
};

// A receipt: the header names the shop (industry, year, evidence), the result is the
// line people read, and the story sits below it. Inside an evidence section the section
// header already names the level, so the badge is optional.
export function EntryCard({
  entry,
  headingLevel = 3,
  showBadge = true,
}: {
  entry: Entry;
  headingLevel?: 3 | 4;
  showBadge?: boolean;
}) {
  const Title = headingLevel === 4 ? "h4" : "h3";
  return (
    <Link href={`/entries/${entry.slug}`} className="receipt">
      <div className="receipt-head">
        <span className="receipt-meta">
          {labelFor("industry", entry.industry)}
          {entry.year ? ` · ${entry.year}` : ""}
        </span>
        {showBadge && <EvidenceBadge level={entry.evidence_strength} />}
      </div>
      <p className="receipt-result">{entry.headline_metric ?? "See the full receipt"}</p>
      <Title className="receipt-title">{entry.title}</Title>
      <p className="company">
        {entry.company}
        <span className={`source-line source-${entry.source_type}`}>{SOURCE_SHORT[entry.source_type]}</span>
      </p>
      <p className="summary">{entry.summary}</p>
      {entry.methods.length > 0 && (
        <div className="receipt-foot">
          <span className="visually-hidden">Methods: </span>
          {entry.methods.slice(0, 3).map((m) => (
            <span key={m} className="tag">
              {labelFor("methods", m)}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
