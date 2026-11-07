"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Entry } from "@/lib/types";
import { EVIDENCE, FACETS, FacetKey, labelFor } from "@/lib/taxonomy";
import { EntryCard } from "./EntryCard";
import CopyButton from "./CopyButton";
import { LAST_RESULTS_KEY } from "./BackToResults";

type Selected = Partial<Record<FacetKey, string[]>>;

const EVIDENCE_RANK: Record<string, number> = { tested: 0, measured: 1, reported: 2, decision: 3 };
// Evidence has its own bar above the results; the sidebar carries the rest.
const SIDEBAR_FACETS = FACETS.filter((f) => f.key !== "evidence_strength");

function entryValues(e: Entry, key: FacetKey): string[] {
  const v = e[key as keyof Entry];
  if (Array.isArray(v)) return v as string[];
  return v ? [String(v)] : [];
}

function matches(e: Entry, selected: Selected, skip?: FacetKey): boolean {
  for (const f of FACETS) {
    if (f.key === skip) continue;
    const sel = selected[f.key];
    if (!sel || sel.length === 0) continue;
    const vals = entryValues(e, f.key);
    // within a facet: OR. across facets: AND.
    if (!sel.some((s) => vals.includes(s))) return false;
  }
  return true;
}

function haystack(e: Entry): string {
  return [
    e.title,
    e.company,
    e.summary,
    e.problem,
    e.research,
    e.insight,
    e.change,
    e.outcome,
    e.headline_metric,
    labelFor("industry", e.industry),
    ...e.methods.map((m) => labelFor("methods", m)),
    ...e.metrics.map((m) => labelFor("metrics", m)),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const plural = (n: number) => `${n} ${n === 1 ? "receipt" : "receipts"}`;

// Within an evidence level, the account least likely to be selling something leads.
const SOURCE_RANK: Record<string, number> = { independent: 0, first_party: 1, community: 2, agency_vendor: 3 };
const PER_TIER = 6;
const PER_PAGE = 24;

const orList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`);

// A plain-language headline for a filtered view, e.g. "16 receipts where research moved revenue".
function resultsHeadline(n: number, sel: Selected, q: string): string {
  const lab = (k: FacetKey) => (sel[k] ?? []).map((v) => labelFor(k, v));
  const ev = lab("evidence_strength");
  let h = `${n} ${ev.length ? `${orList(ev)} ` : ""}${n === 1 ? "receipt" : "receipts"}`;
  if (lab("industry").length) h += ` in ${orList(lab("industry"))}`;
  if (lab("metrics").length) h += ` where research moved ${orList(lab("metrics").map((m) => m.toLowerCase()))}`;
  if (lab("methods").length) h += ` using ${orList(lab("methods").map((m) => m.toLowerCase()))}`;
  const rest = [...lab("product_type"), ...lab("company_size"), ...lab("source_type"), ...lab("research_type")];
  if (rest.length) h += ` · ${rest.join(", ")}`;
  if (q.trim()) h += ` matching “${q.trim()}”`;
  return h;
}

export default function Explorer({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sheetRef = useRef<HTMLDialogElement>(null);

  const initial = useMemo(() => {
    const sel: Selected = {};
    for (const f of FACETS) {
      const raw = params.get(f.key);
      if (raw) sel[f.key] = raw.split(",").filter(Boolean);
    }
    return { sel, q: params.get("q") ?? "", sort: params.get("sort") ?? "evidence" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selected, setSelected] = useState<Selected>(initial.sel);
  const [q, setQ] = useState(initial.q);
  const [sort, setSort] = useState(initial.sort);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [openTiers, setOpenTiers] = useState<Record<string, boolean>>({});
  const [pageCount, setPageCount] = useState(1);
  const sharedLanding = Object.keys(initial.sel).length > 0 || initial.q !== "";

  // keep URL shareable
  useEffect(() => {
    const sp = new URLSearchParams();
    for (const f of FACETS) {
      const s = selected[f.key];
      if (s && s.length) sp.set(f.key, s.join(","));
    }
    if (q.trim()) sp.set("q", q.trim());
    if (sort !== "evidence") sp.set("sort", sort);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    try {
      sessionStorage.setItem(LAST_RESULTS_KEY, qs ? `/?${qs}` : "/");
    } catch {
      /* storage unavailable: entry pages fall back to the full list */
    }
  }, [selected, q, sort, pathname, router]);

  // Someone opening a shared filtered link wants the results, not the pitch again.
  useEffect(() => {
    if (sharedLanding) document.getElementById("results")?.scrollIntoView({ block: "start" });
  }, [sharedLanding]);

  const searchIndex = useMemo(() => new Map(entries.map((e) => [e.slug, haystack(e)])), [entries]);

  const searchFilter = useCallback(
    (query: string) => {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) return entries;
      return entries.filter((e) => {
        const h = searchIndex.get(e.slug) ?? "";
        return terms.every((t) => h.includes(t));
      });
    },
    [entries, searchIndex],
  );

  const textMatched = useMemo(() => searchFilter(q), [searchFilter, q]);

  const results = useMemo(() => {
    const sorted = textMatched.filter((e) => matches(e, selected));
    if (sort === "evidence") {
      sorted.sort(
        (a, b) =>
          EVIDENCE_RANK[a.evidence_strength] - EVIDENCE_RANK[b.evidence_strength] ||
          SOURCE_RANK[a.source_type] - SOURCE_RANK[b.source_type] ||
          (b.year ?? 0) - (a.year ?? 0),
      );
    } else if (sort === "newest") {
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else if (sort === "oldest") {
      sorted.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    } else if (sort === "added") {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return sorted;
  }, [textMatched, selected, sort]);

  // counts per facet value, given every *other* active filter
  const counts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const f of FACETS) {
      const pool = textMatched.filter((e) => matches(e, selected, f.key));
      const c: Record<string, number> = {};
      for (const e of pool) for (const v of entryValues(e, f.key)) c[v] = (c[v] ?? 0) + 1;
      out[f.key] = c;
    }
    return out;
  }, [textMatched, selected]);

  const toggle = useCallback((key: FacetKey, value: string) => {
    setSelected((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const activeChips = FACETS.flatMap((f) => (selected[f.key] ?? []).map((v) => ({ key: f.key, value: v })));
  const activeCount = activeChips.length;
  const sidebarActive = activeChips.filter((c) => c.key !== "evidence_strength").length;

  // Empty state: what would each single removal give back?
  const recoveries = useMemo(() => {
    if (results.length) return [];
    const out: { label: string; n: number; apply: () => void }[] = [];
    for (const { key, value } of activeChips) {
      const without: Selected = { ...selected, [key]: (selected[key] ?? []).filter((v) => v !== value) };
      const n = textMatched.filter((e) => matches(e, without)).length;
      if (n > 0) out.push({ label: `Remove “${labelFor(key, value)}”`, n, apply: () => toggle(key, value) });
    }
    if (q.trim()) {
      const n = entries.filter((e) => matches(e, selected)).length;
      if (n > 0) out.push({ label: `Clear search “${q.trim()}”`, n, apply: () => setQ("") });
    }
    return out.sort((a, b) => b.n - a.n).slice(0, 3);
  }, [results.length, activeChips, selected, textMatched, q, entries, toggle]);

  const groups = useMemo(() => {
    if (sort !== "evidence") return null;
    return EVIDENCE.map((ev) => ({ ev, items: results.filter((e) => e.evidence_strength === ev.value) })).filter(
      (g) => g.items.length,
    );
  }, [results, sort]);

  const openSheet = () => sheetRef.current?.showModal();
  const closeSheet = () => sheetRef.current?.close();
  const showResults = () => {
    closeSheet();
    document.getElementById("results")?.scrollIntoView({ block: "start" });
  };

  const facetList = (idPrefix: string) =>
    SIDEBAR_FACETS.map((f) => {
      const c = counts[f.key] ?? {};
      const opts = f.options.filter((o) => (c[o.value] ?? 0) > 0 || (selected[f.key] ?? []).includes(o.value));
      if (!opts.length) return null;
      const limit = 6;
      const isExpanded = expanded[f.key];
      const shown = isExpanded ? opts : opts.slice(0, limit);
      return (
        <fieldset key={f.key} className="facet">
          <legend className="facet-h">{f.label}</legend>
          {shown.map((o) => {
            const n = c[o.value] ?? 0;
            const checked = (selected[f.key] ?? []).includes(o.value);
            const id = `${idPrefix}-${f.key}-${o.value}`;
            return (
              <div key={o.value} className="facet-opt" data-empty={n === 0 && !checked}>
                <input id={id} type="checkbox" checked={checked} onChange={() => toggle(f.key, o.value)} />
                <label htmlFor={id}>{o.label}</label>
                <span className="count" aria-label={`${n} receipts`}>
                  {n}
                </span>
              </div>
            );
          })}
          {opts.length > limit && (
            <button
              type="button"
              className="text-btn"
              aria-expanded={!!isExpanded}
              onClick={() => setExpanded((x) => ({ ...x, [f.key]: !isExpanded }))}
            >
              {isExpanded ? "Show fewer" : `Show all ${opts.length}`}
            </button>
          )}
        </fieldset>
      );
    });

  const evSelected = selected.evidence_strength ?? [];

  return (
    <>
      <section className="evidence-bar" aria-labelledby="evidence-h">
        <h2 id="evidence-h">Filter by evidence strength</h2>
        <div className="evidence-opts">
          {EVIDENCE.map((ev) => {
            const n = counts.evidence_strength?.[ev.value] ?? 0;
            const on = evSelected.includes(ev.value);
            return (
              <button
                key={ev.value}
                type="button"
                className={`evidence-opt ev-tone-${ev.value}`}
                aria-pressed={on}
                aria-disabled={n === 0 && !on}
                data-empty={n === 0 && !on}
                onClick={() => {
                  if (n === 0 && !on) return;
                  toggle("evidence_strength", ev.value);
                }}
              >
                <span className="evidence-opt-top">
                  <span className="evidence-check" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="12" height="12">
                      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="evidence-opt-label">{ev.label}</span>
                  <span className="evidence-opt-n">{n}</span>
                </span>
                <span className="evidence-opt-def">{ev.short}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="explorer">
        <aside className="filters" aria-label="Filters">
          <a href="#results" className="skip-inline">
            Skip filters
          </a>
          {facetList("side")}
        </aside>

        <section id="results" className="results" aria-labelledby="results-h" tabIndex={-1}>
          {sharedLanding && (
            <p className="landing-note">
              Receipts is a public atlas of documented UX research wins, each rated for how strong the evidence is.{" "}
              <a href="/about">How we rate</a>
            </p>
          )}
          <h2 id="results-h" className={activeCount || q.trim() ? "results-h" : "visually-hidden"}>
            {activeCount || q.trim() ? resultsHeadline(results.length, selected, q) : "Results"}
          </h2>
          <div className="toolbar">
            <label htmlFor="q" className="visually-hidden">
              Search
            </label>
            <input
              id="q"
              className="search"
              type="search"
              placeholder="Search companies, methods, outcomes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="button" className="btn secondary filters-toggle" onClick={openSheet}>
              Filters{sidebarActive ? ` (${sidebarActive})` : ""}
            </button>
            <label htmlFor="sort" className="visually-hidden">
              Sort
            </label>
            <select id="sort" className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="evidence">Strongest</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="added">Added</option>
            </select>
            <button
              type="button"
              className="btn secondary lucky"
              disabled={results.length === 0}
              onClick={() => {
                const pick = results[Math.floor(Math.random() * results.length)];
                if (pick) router.push(`/entries/${pick.slug}`);
              }}
              title={activeCount || q.trim() ? "A random receipt from your current filters" : "A random receipt"}
              aria-label="I'm Feeling Lucky: open a random receipt"
            >
              <span className="lucky-long">I&rsquo;m Feeling Lucky</span>
              <span className="lucky-short">Lucky</span>
            </button>
          </div>

          {activeCount > 0 && (
            <div className="active-filters">
              {activeChips.map(({ key, value }) => (
                <button
                  key={`${key}:${value}`}
                  type="button"
                  className="chip"
                  onClick={() => toggle(key, value)}
                  aria-label={`Remove filter ${labelFor(key, value)}`}
                >
                  {labelFor(key, value)} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" className="text-btn" onClick={() => setSelected({})}>
                Clear all
              </button>
            </div>
          )}

          <div className="result-row">
            <p className="result-count" aria-live="polite">
              {activeCount || q.trim() ? `${plural(results.length)} match` : `All ${plural(results.length)}`}
            </p>
            {(activeCount > 0 || q.trim() !== "") && results.length > 0 && (
              <CopyButton
                label="Copy link to these results"
                className="btn secondary btn-sm"
                text={() => window.location.href}
              />
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <p className="empty-h">
                No receipts match{" "}
                {[...activeChips.map((c) => labelFor(c.key, c.value)), ...(q.trim() ? [`“${q.trim()}”`] : [])].join(
                  " + ",
                )}
                .
              </p>
              {recoveries.length > 0 && (
                <div className="empty-actions">
                  {recoveries.map((r) => (
                    <button key={r.label} type="button" className="btn secondary" onClick={r.apply}>
                      {r.label} <span className="empty-n">→ {plural(r.n)}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      setSelected({});
                      setQ("");
                    }}
                  >
                    Clear everything
                  </button>
                </div>
              )}
              <p className="empty-sub">
                Know a case that fits? <a href="/submit">Submit it</a>.
              </p>
            </div>
          ) : groups ? (
            groups.map(({ ev, items }) => {
              const open = openTiers[ev.value] || items.length <= PER_TIER + 2;
              const shown = open ? items : items.slice(0, PER_TIER);
              return (
                <section key={ev.value} className="tier" aria-labelledby={`tier-${ev.value}`}>
                  <div className="tier-head">
                    <h3 id={`tier-${ev.value}`}>
                      <span className={`ev ev-${ev.value}`}>{ev.label}</span>
                      <span className="tier-n">{plural(items.length)}</span>
                    </h3>
                    <p className="tier-def">{ev.short}</p>
                  </div>
                  <div className="grid">
                    {shown.map((e) => (
                      <EntryCard key={e.slug} entry={e} headingLevel={4} showBadge={false} />
                    ))}
                  </div>
                  {!open && (
                    <button
                      type="button"
                      className="btn secondary show-all"
                      onClick={() => setOpenTiers((t) => ({ ...t, [ev.value]: true }))}
                    >
                      Show all {items.length} {ev.label} receipts
                    </button>
                  )}
                </section>
              );
            })
          ) : (
            <>
              <div className="grid">
                {results.slice(0, PER_PAGE * pageCount).map((e) => (
                  <EntryCard key={e.slug} entry={e} />
                ))}
              </div>
              {results.length > PER_PAGE * pageCount && (
                <button type="button" className="btn secondary show-all" onClick={() => setPageCount((p) => p + 1)}>
                  Show {Math.min(PER_PAGE, results.length - PER_PAGE * pageCount)} more
                </button>
              )}
            </>
          )}

          {results.length > 0 && (
            <p className="end-note">
              {results.length === entries.length
                ? `${plural(entries.length)} so far, and growing.`
                : `${plural(results.length)} in this view.`}{" "}
              Know one that&rsquo;s missing? <a href="/submit">Submit a win</a>.
            </p>
          )}
        </section>
      </div>

      <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-h" onClick={(e) => e.target === e.currentTarget && closeSheet()}>
        <div className="sheet-inner">
          <div className="sheet-head">
            <h2 id="sheet-h">Filters</h2>
            <button type="button" className="text-btn" onClick={closeSheet}>
              Close
            </button>
          </div>
          <div className="sheet-body">{facetList("sheet")}</div>
          <div className="sheet-foot">
            <button
              type="button"
              className="text-btn"
              disabled={sidebarActive === 0}
              onClick={() =>
                setSelected((prev) => ({ evidence_strength: prev.evidence_strength ?? [] }))
              }
            >
              Clear filters
            </button>
            <button type="button" className="btn" onClick={showResults}>
              Show {plural(results.length)}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
