"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Entry } from "@/lib/types";
import { FACETS, FacetKey, labelFor } from "@/lib/taxonomy";
import { EntryCard } from "./EntryCard";

type Selected = Partial<Record<FacetKey, string[]>>;

const EVIDENCE_RANK: Record<string, number> = { tested: 0, measured: 1, reported: 2, decision: 3 };

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
  return [e.title, e.company, e.summary, e.problem, e.research, e.insight, e.change, e.outcome, e.headline_metric]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function Explorer({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

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
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
  }, [selected, q, sort, pathname, router]);

  const searchIndex = useMemo(() => new Map(entries.map((e) => [e.slug, haystack(e)])), [entries]);

  const textMatched = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return entries;
    return entries.filter((e) => {
      const h = searchIndex.get(e.slug) ?? "";
      return terms.every((t) => h.includes(t));
    });
  }, [entries, q, searchIndex]);

  const results = useMemo(() => {
    const r = textMatched.filter((e) => matches(e, selected));
    const sorted = [...r];
    if (sort === "evidence") {
      sorted.sort(
        (a, b) =>
          EVIDENCE_RANK[a.evidence_strength] - EVIDENCE_RANK[b.evidence_strength] || (b.year ?? 0) - (a.year ?? 0),
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

  return (
    <div className="explorer">
      <aside className="filters" aria-label="Filters">
        <button
          type="button"
          className="btn secondary filters-toggle"
          aria-expanded={open}
          aria-controls="filters-body"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide filters" : `Filters${activeCount ? ` (${activeCount})` : ""}`}
        </button>
        <div id="filters-body" className="filters-body" data-open={open}>
          {FACETS.map((f) => {
            const c = counts[f.key] ?? {};
            const opts = f.options.filter((o) => (c[o.value] ?? 0) > 0 || (selected[f.key] ?? []).includes(o.value));
            if (!opts.length) return null;
            // show options with results first, keep taxonomy order otherwise
            const limit = 6;
            const isExpanded = expanded[f.key];
            const shown = isExpanded ? opts : opts.slice(0, limit);
            return (
              <fieldset key={f.key} className="facet" style={{ border: "none", margin: 0, padding: undefined }}>
                <legend className="visually-hidden">{f.label}</legend>
                <h3 aria-hidden="true">{f.label}</h3>
                {shown.map((o) => {
                  const n = c[o.value] ?? 0;
                  const checked = (selected[f.key] ?? []).includes(o.value);
                  return (
                    <label key={o.value} className="facet-opt" data-empty={n === 0 && !checked} title={o.description}>
                      <input type="checkbox" checked={checked} onChange={() => toggle(f.key, o.value)} />
                      <span>{o.label}</span>
                      <span className="count">{n}</span>
                    </label>
                  );
                })}
                {opts.length > limit && (
                  <button
                    type="button"
                    className="facet-more"
                    onClick={() => setExpanded((x) => ({ ...x, [f.key]: !isExpanded }))}
                  >
                    {isExpanded ? "Show fewer" : `Show all ${opts.length}`}
                  </button>
                )}
              </fieldset>
            );
          })}
        </div>
      </aside>

      <section aria-label="Results">
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
          <label htmlFor="sort" className="visually-hidden">
            Sort
          </label>
          <select id="sort" className="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="evidence">Strongest evidence first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="added">Recently added</option>
          </select>
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
            <button type="button" className="facet-more" onClick={() => setSelected({})}>
              Clear all
            </button>
          </div>
        )}

        <p className="result-count" aria-live="polite">
          {results.length} {results.length === 1 ? "receipt" : "receipts"}
        </p>

        {results.length ? (
          <div className="grid">
            {results.map((e) => (
              <EntryCard key={e.slug} entry={e} />
            ))}
          </div>
        ) : (
          <div className="empty">
            Nothing matches yet. Know one?{" "}
            <a href="/submit" style={{ color: "var(--accent)" }}>
              Submit it
            </a>
            .
          </div>
        )}
      </section>
    </div>
  );
}
