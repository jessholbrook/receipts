import Link from "next/link";
import type { Entry } from "@/lib/types";
import { labelFor } from "@/lib/taxonomy";
import Thumb from "./Thumb";

export function EvidenceBadge({ level }: { level: Entry["evidence_strength"] }) {
  return <span className={`ev ev-${level}`}>{labelFor("evidence_strength", level)}</span>;
}

// A receipt: the header names the shop (industry, year, evidence), the result is the
// line people read, and the story sits below it.
export function EntryCard({ entry, headingLevel = 3 }: { entry: Entry; headingLevel?: 3 | 4 }) {
  const Title = headingLevel === 4 ? "h4" : "h3";
  return (
    <Link href={`/entries/${entry.slug}`} className="receipt">
      <div className="receipt-head">
        {entry.image_url && <Thumb src={entry.image_url} />}
        <span className="receipt-meta">
          {labelFor("industry", entry.industry)}
          {entry.year ? ` · ${entry.year}` : ""}
        </span>
        <EvidenceBadge level={entry.evidence_strength} />
      </div>
      <p className="receipt-result">{entry.headline_metric ?? "See the full receipt"}</p>
      <Title className="receipt-title">{entry.title}</Title>
      <p className="company">{entry.company}</p>
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
