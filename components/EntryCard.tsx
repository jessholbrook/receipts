import Link from "next/link";
import type { Entry } from "@/lib/types";
import { labelFor } from "@/lib/taxonomy";
import SourceMark from "./SourceMark";
import Thumb from "./Thumb";
import { yearLabel } from "@/lib/cite";

export function EvidenceBadge({ level }: { level: Entry["evidence_strength"] }) {
  return <span className={`ev ev-${level}`}>{labelFor("evidence_strength", level)}</span>;
}

// A receipt: the header names the shop (industry, year, evidence), the result is the line
// people read, then who it is and who is telling it. The full title lives on the entry page;
// on the card it would only repeat the result. Inside an evidence section the section header
// already names the level, so the badge is optional.
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
      {entry.image_url && <Thumb src={entry.image_url} className="card-thumb" />}
      <div className="receipt-head">
        <span className="receipt-meta">
          {labelFor("industry", entry.industry)}
          {entry.year ? ` · ${yearLabel(entry)}` : ""}
        </span>
        {showBadge && <EvidenceBadge level={entry.evidence_strength} />}
      </div>
      <p className="receipt-result">{entry.headline_metric ?? "See the full receipt"}</p>
      <Title className="receipt-title">{entry.company}</Title>
      <p className="source-line">
        <SourceMark type={entry.source_type} />
      </p>
      <p className="summary">{entry.summary}</p>
      {entry.methods.length > 0 && (
        <div className="receipt-foot">
          <span className="visually-hidden">Method: </span>
          <span className="tag">{labelFor("methods", entry.methods[0])}</span>
          {entry.methods.length > 1 && (
            <span className="tag-more" aria-label={`and ${entry.methods.length - 1} more`}>
              +{entry.methods.length - 1}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
