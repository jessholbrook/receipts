import { Suspense } from "react";
import Explorer from "@/components/Explorer";
import { getEntries } from "@/lib/supabase";

export const revalidate = 300;

export default async function Home() {
  const entries = await getEntries();

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
