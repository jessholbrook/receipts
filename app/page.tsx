import { Suspense } from "react";
import type { Metadata } from "next";
import Explorer from "@/components/Explorer";
import { getEntriesCached } from "@/lib/supabase";
import { countPhrase, describeFilters, filterEntries, isFiltered, parseSelected, shareDescription } from "@/lib/filters";
import { FACETS } from "@/lib/taxonomy";
import { shareMeta } from "@/lib/share";

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// A filtered link (e.g. /?evidence_strength=tested&metrics=revenue) gets its own preview card:
// a title naming the view, a count, and an image drawn by /og/filtered. Unfiltered, the layout's
// homepage card applies.
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const sel = parseSelected((k) => first(sp[k]));
  const q = (first(sp.q) ?? "").trim();
  if (!isFiltered(sel, q)) return {};

  const entries = await getEntriesCached().catch(() => []);
  const hits = filterEntries(entries, sel, q);
  const { phrase, context } = describeFilters(sel, q);
  const n = hits.length;
  const title = n
    ? `${countPhrase(n, phrase)}${context ? ` · ${context}` : ""}`
    : `No receipts yet: ${phrase}${context ? ` · ${context}` : ""}`;
  const description = shareDescription(hits);

  // Canonical query (facet order, no sort) so equal views share one cached image.
  const query = new URLSearchParams();
  for (const f of FACETS) if (sel[f.key]?.length) query.set(f.key, sel[f.key]!.join(","));
  if (q) query.set("q", q);
  const share = shareMeta(title, description);
  return {
    title,
    description,
    ...share,
    openGraph: { ...share.openGraph, images: [{ url: `/og/filtered?${query}`, width: 1200, height: 630, alt: title }] },
    twitter: { ...share.twitter, images: [`/og/filtered?${query}`] },
  };
}

export default async function Home() {
  const entries = await getEntriesCached();

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <h1>What has UX research ever done for us?</h1>
          <p className="lede">
            We&rsquo;re tired of this question and we&rsquo;re guessing we&rsquo;re not the only ones. Receipts is a
            public atlas of documented UX research wins you can reference and share, so we can all move past justifying
            the value of research.
          </p>
        </div>
      </section>
      <div className="wrap">
        <Suspense fallback={<p className="result-count">Loading receipts…</p>}>
          <Explorer entries={entries} />
        </Suspense>
      </div>
    </>
  );
}
