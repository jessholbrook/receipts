import { renderOg } from "@/lib/og";
import { getEntriesCached } from "@/lib/supabase";
import { countPhrase, describeFilters, filterEntries, imageSubtitle, isFiltered, parseSelected } from "@/lib/filters";

// Preview image for a filtered homepage link, e.g. /og/filtered?evidence_strength=tested&metrics=revenue
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const sel = parseSelected((k) => params.get(k));
  const q = params.get("q") ?? "";
  const entries = await getEntriesCached().catch(() => []);
  const hits = filterEntries(entries, sel, q);
  const { phrase, context } = describeFilters(sel, q);
  const onlyEvidence = sel.evidence_strength?.length === 1 ? sel.evidence_strength[0] : undefined;

  const res = await renderOg(
    !isFiltered(sel, q)
      ? { kicker: `${entries.length} documented UX research wins`, title: "What has UX research ever done for us?", company: "Rated for evidence strength, with every source.", metric: "Show me the receipts." }
      : hits.length === 0
        ? { kicker: context || "Filtered view", title: "No receipts match this view yet", company: phrase, metric: "Know one? Submit a receipt." }
        : {
            kicker: context || "Filtered view",
            title: countPhrase(hits.length, phrase),
            company: imageSubtitle(hits),
            evidence: onlyEvidence,
            metric: "Show me the receipts.",
          },
  );
  res.headers.set("cache-control", "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400");
  return res;
}
