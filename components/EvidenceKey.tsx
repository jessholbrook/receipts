import type { Entry } from "@/lib/types";
import { EVIDENCE } from "@/lib/taxonomy";
import EvidenceSign from "./EvidenceSign";

// "How strong is the evidence?": the four levels with live counts. Each links to that filtered
// view (a full page load, so the explorer starts from the link's filters).
export default function EvidenceKey({ entries }: { entries: Entry[] }) {
  return (
    <section className="ev-key" aria-labelledby="ev-key-h">
      <div className="wrap">
        <h2 id="ev-key-h">how strong is the evidence?</h2>
        <ul>
          {EVIDENCE.map((ev) => (
            <li key={ev.value}>
              <a href={`/?evidence_strength=${ev.value}`} data-track="filter" data-slug={`key:${ev.value}`}>
                <EvidenceSign level={ev.value as Entry["evidence_strength"]} size="lg" />
                <span className="ev-key-n">{entries.filter((e) => e.evidence_strength === ev.value).length}</span>
                <span className="ev-key-label">{ev.label.toLowerCase()}</span>
                <span className="ev-key-desc">{ev.short}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
