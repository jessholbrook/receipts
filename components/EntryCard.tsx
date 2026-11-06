import Link from "next/link";
import type { Entry } from "@/lib/types";
import { labelFor } from "@/lib/taxonomy";
import Thumb from "./Thumb";

export function EvidenceBadge({ level }: { level: Entry["evidence_strength"] }) {
  return (
    <span className={`ev ev-${level}`} title={`Evidence: ${labelFor("evidence_strength", level)}`}>
      {labelFor("evidence_strength", level)}
    </span>
  );
}

export function EntryCard({ entry }: { entry: Entry }) {
  const total = entry.headline_metric ?? (entry.evidence_strength === "decision" ? "Decision changed" : "See details");
  return (
    <Link href={`/entries/${entry.slug}`} className="receipt">
      {entry.image_url && <Thumb src={entry.image_url} />}
      <div className="receipt-top">
        <span>
          {labelFor("industry", entry.industry)}
          {entry.year ? ` · ${entry.year}` : ""}
        </span>
        <EvidenceBadge level={entry.evidence_strength} />
      </div>
      <h2>{entry.title}</h2>
      <p className="company">{entry.company}</p>
      <p className="summary">{entry.summary}</p>
      <div className="tags">
        {entry.methods.slice(0, 3).map((m) => (
          <span key={m} className="tag">
            {labelFor("methods", m)}
          </span>
        ))}
      </div>
      <div className="receipt-total">
        <span className="lbl">Total</span>
        <span className="val">{total}</span>
      </div>
    </Link>
  );
}
