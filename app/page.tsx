import { Suspense } from "react";
import Explorer from "@/components/Explorer";
import { getEntries } from "@/lib/supabase";

export const revalidate = 300;

export default async function Home() {
  const entries = await getEntries();
  const companies = new Set(entries.map((e) => e.company)).size;
  const strong = entries.filter((e) => e.evidence_strength === "tested" || e.evidence_strength === "measured").length;
  const industries = new Set(entries.map((e) => e.industry).filter(Boolean)).size;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>What has UX research ever done for us?</h1>
          <p className="lede">
            All right, but apart from <em>the checkout fixes</em>, <em>the features it killed before launch</em>, and{" "}
            <em>the support tickets that never got filed</em>… Receipts is a public atlas of documented research wins,
            each rated for how strong the evidence really is.
          </p>
          <div className="stats">
            <div className="stat">
              <span className="stat-n">{entries.length}</span>
              <span className="stat-l">receipts</span>
            </div>
            <div className="stat">
              <span className="stat-n">{companies}</span>
              <span className="stat-l">organizations</span>
            </div>
            <div className="stat">
              <span className="stat-n">{industries}</span>
              <span className="stat-l">industries</span>
            </div>
            <div className="stat">
              <span className="stat-n">{strong}</span>
              <span className="stat-l">tested or measured</span>
            </div>
          </div>
        </div>
      </section>
      <div className="wrap">
        <Suspense fallback={<p className="result-count">Loading…</p>}>
          <Explorer entries={entries} />
        </Suspense>
      </div>
    </>
  );
}
