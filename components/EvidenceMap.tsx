"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Entry } from "@/lib/types";
import { EVIDENCE, labelFor } from "@/lib/taxonomy";
import { IMPACT_GROUPS, impactGroup } from "@/lib/impact";
import SourceMark from "./SourceMark";

export default function EvidenceMap({ entries }: { entries: Entry[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const detail = useRef<HTMLElement>(null);
  const selected = entries.find((e) => e.slug === selectedSlug) ?? null;
  const rows = useMemo(() => IMPACT_GROUPS.map((g) => ({
    ...g, entries: entries.filter((e) => impactGroup(e) === g.id),
  })).filter((g) => g.id !== "unassigned" || g.entries.length > 0), [entries]);

  function select(entry: Entry) {
    setSelectedSlug(entry.slug);
    if (window.matchMedia("(max-width: 900px)").matches) {
      // The summary precedes the map on small screens so the selected story is reachable.
      requestAnimationFrame(() => detail.current?.scrollIntoView({ block: "start" }));
    }
  }

  return (
    <div className="evidence-map">
      <div className="map-intro">
        <div><h2>What has research changed?</h2><p>Each dot is a receipt. Choose one to see what changed.</p></div>
        <a href="/how-we-rate">How we rate the evidence ↗</a>
      </div>
      <div className="map-layout">
        <div className="map-chart" role="group" aria-label="Receipts by contribution and evidence category">
          <div className="map-columns" aria-hidden="true">
            <span className="map-axis">What changed ↓<br />Evidence →</span>
            {EVIDENCE.map((ev) => <div key={ev.value}><span className={`ev ev-${ev.value}`}>{ev.label}</span><p>{ev.short}</p></div>)}
          </div>
          {rows.map((row) => <section className="map-row" key={row.id} aria-label={row.label}>
            <div className="map-row-heading"><h3>{row.label}</h3><span>{row.entries.length} {row.entries.length === 1 ? "receipt" : "receipts"}</span></div>
            {EVIDENCE.map((ev) => {
              const items = row.entries.filter((e) => e.evidence_strength === ev.value);
              return <div className="map-cell" key={ev.value} role="group" aria-label={`${row.label}, ${ev.label}: ${items.length} ${items.length === 1 ? "receipt" : "receipts"}`}>
                <span className={`map-mobile-label ev ev-${ev.value}`}>{ev.label}</span>
                <div className="map-dots">
                  {items.map((entry) => <button key={entry.slug} type="button"
                    className={`map-dot map-dot-${entry.evidence_strength}`}
                    aria-label={`${entry.company}: ${entry.headline_metric ?? entry.title}. ${ev.label}.`}
                    aria-pressed={selected?.slug === entry.slug}
                    title={`${entry.company} · ${entry.headline_metric ?? entry.title}`}
                    onClick={() => select(entry)}><span aria-hidden="true" /></button>)}
                  {!items.length && <span className="map-no-cases" aria-label="No matching receipts">—</span>}
                </div>
              </div>;
            })}
          </section>)}
          <details className="map-method"><summary>How receipts are placed</summary>
            <p>We group receipts by the main thing research changed. Some fit more than one row; we pick one so each receipt appears once. The columns show how strong the evidence is.</p>
            <p>The dots don’t measure the size of a win. An empty space just means there are no matching receipts in this view.</p>
          </details>
        </div>
        <aside className="map-detail" ref={detail} aria-label="Selected receipt" aria-live="polite">
          {selected ? <>
            <div className="map-detail-top"><span className={`ev ev-${selected.evidence_strength}`}>{labelFor("evidence_strength", selected.evidence_strength)}</span><button type="button" className="text-btn" onClick={() => setSelectedSlug(null)} aria-label="Close receipt preview">Close</button></div>
            <p className="map-detail-meta">{labelFor("industry", selected.industry)}{selected.year ? ` · ${selected.year_approx ? "c. " : ""}${selected.year}` : " · Year not recorded"}</p>
            <h3>{selected.headline_metric ?? selected.title}</h3>
            <p className="map-company">{selected.company}</p>
            <SourceMark type={selected.source_type} />
            <p>{selected.summary}</p>
            {selected.caveats && <details><summary>What to keep in mind</summary><p>{selected.caveats}</p>{selected.attribution && <p>{selected.attribution}</p>}</details>}
            <Link href={`/entries/${selected.slug}`} className="btn secondary">Read receipt & sources ↗</Link>
          </> : <div className="map-detail-empty"><span aria-hidden="true" className="map-empty-dot" /><h3>Take a closer look.</h3><p>Choose a receipt to see what the research found, what changed, and where the evidence comes from.</p></div>}
        </aside>
      </div>
    </div>
  );
}
