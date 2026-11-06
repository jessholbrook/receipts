import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEntries, getEntry } from "@/lib/supabase";
import { EVIDENCE, labelFor, SOURCE_TYPES } from "@/lib/taxonomy";
import { EvidenceBadge } from "@/components/EntryCard";

export const revalidate = 300;

export async function generateStaticParams() {
  const entries = await getEntries();
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEntry(slug);
  if (!e) return { title: "Not found" };
  return { title: e.title, description: e.summary };
}

function receiptNo(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String(h % 100000).padStart(5, "0");
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

  return (
    <div className="wrap">
      <div className="detail">
        <article>
          <div className="crumbs">
            <Link href="/">All receipts</Link>
            {e.industry && (
              <>
                {" / "}
                <Link href={`/?industry=${e.industry}`}>{labelFor("industry", e.industry)}</Link>
              </>
            )}
          </div>
          <EvidenceBadge level={e.evidence_strength} />
          <h1>{e.title}</h1>
          <p className="company">
            {e.company}
            {e.is_anonymized && " (anonymized)"}
            {e.year ? ` · ${e.year}` : ""}
          </p>
          <p className="summary">{e.summary}</p>

          <div className="story">
            <Section label="The problem" text={e.problem} />
            <Section label="The research" text={e.research} />
            <Section label="The insight" text={e.insight} />
            <Section label="The change" text={e.change} />
            <Section label="The outcome" text={e.outcome} />
            <Section label="Attribution" text={e.attribution} />
            {e.caveats && (
              <section>
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
              <ul className="sources">
                {e.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span className="meta">
                      {[s.publisher, s.date].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
                {e.sources.length === 0 && <li className="meta">Community submission, no public source.</li>}
              </ul>
            </section>
          </div>
        </article>

        <aside className="side-receipt">
          <div className="receipt" style={{ paddingBottom: 30 }}>
            <div className="receipt-top">
              <span>Receipt</span>
              <span>No. {receiptNo(e.slug)}</span>
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
              <dt>Methods</dt>
              <dd className="tags" style={{ marginBottom: 0 }}>
                {e.methods.map((m) => (
                  <FacetLink key={m} facet="methods" value={m} />
                ))}
              </dd>
              <dt>Metrics</dt>
              <dd className="tags" style={{ marginBottom: 0 }}>
                {e.metrics.map((m) => (
                  <FacetLink key={m} facet="metrics" value={m} />
                ))}
              </dd>
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
            <div className="receipt-total" style={{ marginTop: 18 }}>
              <span className="lbl">Thank you</span>
              <span className="val" style={{ fontSize: 13 }}>
                Come again
              </span>
            </div>
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
