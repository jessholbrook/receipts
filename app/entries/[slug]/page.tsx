import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { shareMeta } from "@/lib/share";
import { getEntries, getEntry } from "@/lib/supabase";
import { EVIDENCE, labelFor, SOURCE_TYPES } from "@/lib/taxonomy";
import { EvidenceBadge } from "@/components/EntryCard";
import CiteActions from "@/components/CiteActions";
import BackToResults from "@/components/BackToResults";
import Thumb from "@/components/Thumb";
import { buildCitation, entryUrl, firstSentence, yearLabel } from "@/lib/cite";

export const revalidate = 300;

export async function generateStaticParams() {
  const entries = await getEntries();
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEntry(slug);
  if (!e) return { title: "Not found" };
  const ev = EVIDENCE.find((x) => x.value === e.evidence_strength);
  const src = SOURCE_TYPES.find((x) => x.value === e.source_type);
  // Each receipt unfurls as itself in Slack and elsewhere, with its honesty labels.
  const shareTitle = `${e.headline_metric ? `${e.headline_metric} · ` : ""}${e.company}`;
  // Short enough that Slack keeps the caveat (it trims unfurls around 300 characters).
  const caveat = firstSentence(e.caveats);
  const shareDesc = `${ev?.label}: ${ev?.short}. Source: ${src?.label}.${caveat ? ` Caveat: ${caveat}` : ""}`.slice(0, 280);
  return {
    title: e.title,
    description: e.summary,
    ...shareMeta(shareTitle, shareDesc, { type: "article", url: entryUrl(e.slug) }),
  };
}

function Section({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <section>
      <h2>{label}</h2>
      <div>
        {text.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

function FacetLink({ facet, value }: { facet: string; value: string }) {
  return (
    <Link href={`/?${facet}=${value}`} className="tag">
      {labelFor(facet, value)}
    </Link>
  );
}

export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEntry(slug);
  if (!e) notFound();

  const ev = EVIDENCE.find((x) => x.value === e.evidence_strength);
  const src = SOURCE_TYPES.find((x) => x.value === e.source_type);
  const first = e.sources[0];

  return (
    <div className="wrap">
      <div className="detail">
        <article>
          <div className="crumbs">
            <BackToResults />
            {e.industry && (
              <>
                {" / "}
                <Link href={`/?industry=${e.industry}`}>{labelFor("industry", e.industry)}</Link>
              </>
            )}
          </div>
          <h1>{e.title}</h1>
          <p className="company">
            <EvidenceBadge level={e.evidence_strength} />{" "}
            {e.company}
            {e.is_anonymized && " (anonymized)"}
            {e.year ? ` · ${yearLabel(e)}` : ""}
          </p>
          <p className="summary">{e.summary}</p>
          <p className="source-note">
            <strong>{src?.label}.</strong> {src?.description}
          </p>
          {e.caveats && (
            <p className="caveat-line">
              <strong>Caveat:</strong> {firstSentence(e.caveats)}{" "}
              <a href="#caveats">All caveats</a>
            </p>
          )}
          <CiteActions slug={e.slug} url={entryUrl(e.slug)} citation={buildCitation(e)} />

          <div className="story">
            <Section label="The problem" text={e.problem} />
            <Section label="The research" text={e.research} />
            <Section label="The insight" text={e.insight} />
            <Section label="The change" text={e.change} />
            <Section label="The outcome" text={e.outcome} />
            <Section label="Attribution" text={e.attribution} />
            {e.caveats && (
              <section id="caveats">
                <h2>Caveats</h2>
                <div className="callout">
                  {e.caveats.split(/\n{2,}/).map((p, i) => (
                    <p key={i} style={{ margin: 0 }}>
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2>Sources</h2>
              <div>
                {e.image_url && first && e.source_type !== "agency_vendor" && (
                  <a href={first.url} target="_blank" rel="noopener noreferrer" className="source-preview"
                    data-track="source_click"
                    data-slug={e.slug}
                    data-host={new URL(first.url).hostname}
                    aria-label={`Open source: ${first.title}`}
                  >
                    <Thumb src={e.image_url} className="source-thumb" />
                  </a>
                )}
                <ul className="sources">
                  {e.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-track="source_click"
                        data-slug={e.slug}
                        data-host={new URL(s.url).hostname}
                      >
                        {s.title}
                      </a>
                      <span className="meta">
                        {[s.publisher, s.date].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                  {e.sources.length === 0 && <li className="meta">Community submission, no public source.</li>}
                </ul>
              </div>
            </section>
          </div>
        </article>

        <aside className="side-receipt">
          <div className="receipt" style={{ paddingBottom: 30 }}>
            <div className="receipt-top">
              <span>Receipt</span>
              <span>researchreceipts.org</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase" }}>
              Headline result
            </div>
            <div className="big-metric">
              {e.headline_metric ?? (e.evidence_strength === "decision" ? "Decision changed" : "—")}
            </div>
            <dl>
              <dt>Evidence</dt>
              <dd>
                <strong>{ev?.label}.</strong> {ev?.description}
              </dd>
              <dt>Source</dt>
              <dd>
                <strong>{src?.label}.</strong> {src?.description}
              </dd>
              {e.verified_by && (
                <>
                  <dt>Verified by</dt>
                  <dd>{e.verified_by}</dd>
                </>
              )}
              {e.methods.length > 0 && (
                <>
                  <dt>Methods</dt>
                  <dd className="tags" style={{ marginBottom: 0 }}>
                    {e.methods.map((m) => (
                      <FacetLink key={m} facet="methods" value={m} />
                    ))}
                  </dd>
                </>
              )}
              {e.metrics.length > 0 && (
                <>
                  <dt>Metrics</dt>
                  <dd className="tags" style={{ marginBottom: 0 }}>
                    {e.metrics.map((m) => (
                      <FacetLink key={m} facet="metrics" value={m} />
                    ))}
                  </dd>
                </>
              )}
              {e.research_type && (
                <>
                  <dt>Research type</dt>
                  <dd>{labelFor("research_type", e.research_type)}</dd>
                </>
              )}
              {e.product_type && (
                <>
                  <dt>Product</dt>
                  <dd>{labelFor("product_type", e.product_type)}</dd>
                </>
              )}
              {e.company_size && (
                <>
                  <dt>Company size</dt>
                  <dd>{labelFor("company_size", e.company_size)}</dd>
                </>
              )}
            </dl>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 16 }}>
            Spot an error or a better source?{" "}
            <a href={`https://github.com/jessholbrook/receipts/issues/new?title=${encodeURIComponent("Correction: " + e.title)}`}>
              Suggest a correction
            </a>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
