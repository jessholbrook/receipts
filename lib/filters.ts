// Filtering shared by the browser (Explorer) and the server (link previews), so a shared link's
// preview card always counts and describes exactly what the link shows.

import type { Entry } from "@/lib/types";
import { EVIDENCE, FACETS, FacetKey, isValid, labelFor } from "@/lib/taxonomy";

export type Selected = Partial<Record<FacetKey, string[]>>;

export function entryValues(e: Entry, key: FacetKey): string[] {
  const v = e[key as keyof Entry];
  if (Array.isArray(v)) return v as string[];
  return v ? [String(v)] : [];
}

export function matches(e: Entry, selected: Selected, skip?: FacetKey): boolean {
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

export function haystack(e: Entry): string {
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

export function searchTerms(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Read filters from URL params. Unknown values are dropped so a mangled link can't break the card. */
export function parseSelected(get: (key: string) => string | null | undefined): Selected {
  const sel: Selected = {};
  for (const f of FACETS) {
    const vals = (get(f.key) ?? "")
      .split(",")
      .filter((v) => v && isValid(f.key, v));
    if (vals.length) sel[f.key] = vals;
  }
  return sel;
}

export function filterEntries(entries: Entry[], sel: Selected, q: string): Entry[] {
  const terms = searchTerms(q);
  return entries.filter((e) => {
    if (!matches(e, sel)) return false;
    if (!terms.length) return true;
    const h = haystack(e);
    return terms.every((t) => h.includes(t));
  });
}

export function isFiltered(sel: Selected, q: string): boolean {
  return Object.values(sel).some((v) => v && v.length) || !!q.trim();
}

// How each source type reads after "from" in a preview title: "25 receipts from agency or vendor accounts".
const SOURCE_PHRASE: Record<string, string> = {
  first_party: "companies' own accounts",
  agency_vendor: "agency or vendor accounts",
  independent: "independent sources",
  community: "community submissions",
};

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const orList = (xs: string[]) => (xs.length <= 2 ? xs.join(" or ") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`);

/**
 * Plain-language name for a filtered view, e.g.
 *   phrase:  "Tested receipts about revenue"
 *   context: "Banking & fintech · Mobile app"
 */
export function describeFilters(sel: Selected, q: string): { phrase: string; context: string } {
  // Strongest evidence first, whatever order the link lists them in.
  const ev = EVIDENCE.filter((o) => sel.evidence_strength?.includes(o.value)).map((o) => o.label);
  const metrics = (sel.metrics ?? []).map((v) => lower(labelFor("metrics", v)));
  const methods = (sel.methods ?? []).map((v) => lower(labelFor("methods", v)));
  const query = q.trim();

  let phrase = ev.length ? `${orList(ev)} receipts` : "Receipts";
  if (metrics.length) phrase += ` about ${orList(metrics)}`;
  if (methods.length) phrase += ` using ${orList(methods)}`;
  const sources = (sel.source_type ?? []).map((v) => SOURCE_PHRASE[v] ?? lower(labelFor("source_type", v)));
  if (sources.length) phrase += ` from ${orList(sources)}`;
  if (query) phrase += ` matching “${query.slice(0, 40)}”`;

  const context = (["industry", "product_type", "company_size", "research_type"] as FacetKey[])
    .flatMap((k) => (sel[k] ?? []).map((v) => labelFor(k, v)))
    .join(" · ");
  return { phrase, context };
}

/** "12 Tested receipts about revenue", "1 receipt about revenue", "4 receipts". */
export function countPhrase(n: number, phrase: string): string {
  const noun = n === 1 ? "receipt" : "receipts";
  return phrase.startsWith("Receipts") ? `${n} ${noun}${phrase.slice("Receipts".length)}` : `${n} ${phrase.replace(/ receipts\b/, ` ${noun}`)}`;
}

/** "3 Tested, 5 Measured and 1 Decision", or "All 14 rated Tested" when there's one level. */
export function evidenceBreakdown(entries: Entry[]): string {
  const parts = EVIDENCE.map((ev) => ({ label: ev.label, n: entries.filter((e) => e.evidence_strength === ev.value).length })).filter(
    (p) => p.n,
  );
  if (parts.length === 1) return entries.length === 1 ? `Rated ${parts[0].label}` : `All ${parts[0].n} rated ${parts[0].label}`;
  const xs = parts.map((p) => `${p.n} ${p.label}`);
  return xs.length ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : "";
}

/** Sentence for a link preview: evidence mix, then how many come from vendors (unless the link filters by source). */
export function shareDescription(hits: Entry[], sel: Selected = {}): string {
  if (!hits.length) return "Nothing documented for this view yet. Know a case? Submit a receipt.";
  const vendors = hits.filter((e) => e.source_type === "agency_vendor").length;
  const vendorLine =
    vendors === 0 || sel.source_type?.length
      ? ""
      : vendors === hits.length
        ? hits.length === 1
          ? " It comes from an agency or vendor account, flagged as such."
          : " All come from agency or vendor accounts, flagged as such."
        : ` ${vendors} ${vendors === 1 ? "comes from an agency or vendor account" : "come from agency or vendor accounts"}, flagged as such.`;
  return `${evidenceBreakdown(hits)}.${vendorLine}`;
}

/** Subtitle for a filtered preview image: the evidence mix, or, when there's only one level, the vendor share. */
export function imageSubtitle(hits: Entry[], sel: Selected = {}): string {
  const levels = new Set(hits.map((e) => e.evidence_strength)).size;
  if (levels > 1 || sel.source_type?.length) return evidenceBreakdown(hits);
  const vendors = hits.filter((e) => e.source_type === "agency_vendor").length;
  if (!vendors) return hits.length === 1 ? "Not from a vendor account" : "None from vendor accounts";
  return vendors === hits.length ? "From vendor accounts, flagged" : `${vendors} of ${hits.length} from vendor accounts, flagged`;
}
