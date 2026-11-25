import Link from "next/link";
import type { Entry } from "@/lib/types";
import { labelFor } from "@/lib/taxonomy";
import SourceMark from "./SourceMark";
import Thumb from "./Thumb";
import { yearLabel } from "@/lib/cite";

export function EvidenceBadge({ level }: { level: Entry["evidence_strength"] }) {
  return <span className={`ev ev-${level}`}>{labelFor("evidence_strength", level)}</span>;
}

// A receipt, after Troller: a black rule, the source's photo pressed into grey, the evidence sign,
// then the result set as large as it will go. The full title sits under the result in plain text;
// company and who is telling the story close the card.
function resultSize(text: string): "xl" | "l" | "m" {
  if (text.length <= 7) return "xl";
  if (text.length <= 18) return "l";
  return "m";
}

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
  const result = entry.headline_metric ?? "See the full receipt";
  return (
    <Link href={`/entries/${entry.slug}`} className="receipt">
      {entry.image_url && (
        <span className="card-thumb-wrap">
          <Thumb src={entry.image_url} className="card-thumb" />
        </span>
      )}
      <div className="receipt-head">
        {showBadge && <EvidenceBadge level={entry.evidence_strength} />}
        <span className="receipt-meta">
          {labelFor("industry", entry.industry)}
          {entry.year ? ` · ${yearLabel(entry)}` : ""}
        </span>
      </div>
      <p className={`receipt-result receipt-result-${resultSize(result)}`}>{result}</p>
      <Title className="receipt-title">{entry.title}</Title>
      <p className="source-line">
        <span className="receipt-company">{entry.company}</span>
        <SourceMark type={entry.source_type} />
      </p>
    </Link>
  );
}
