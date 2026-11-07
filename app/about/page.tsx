import Link from "next/link";
import type { Metadata } from "next";
import { getEntries } from "@/lib/supabase";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description:
    "Receipts is a public atlas of documented UX research wins, each rated for how strong the evidence is and who is telling the story.",
};

export default async function About() {
  const entries = await getEntries();
  const n = entries.length;
  const count = (f: (e: (typeof entries)[number]) => boolean) => entries.filter(f).length;
  const strong = count((e) => e.evidence_strength === "tested" || e.evidence_strength === "measured");
  const decisions = count((e) => e.evidence_strength === "decision");
  const independent = count((e) => e.source_type === "independent");
  const vendor = count((e) => e.source_type === "agency_vendor");
  const orgs = new Set(entries.map((e) => e.company)).size;

  return (
    <div className="wrap">
      <div className="prose">
        <h1>About Receipts</h1>
        <p>
          Receipts is a public atlas of documented UX research wins: cases where research changed a product, a metric
          or a decision. Each one is rated for how strong the evidence is and labelled with who is telling the story.
        </p>

        <h2>Why it exists</h2>
        <p>
          &ldquo;What has UX research ever done for us?&rdquo; Most researchers have heard some version of that
          question. The answers exist, but they are scattered across company blogs, conference talks, government
          reports and papers, and they vary a lot in how much they actually prove.
        </p>
        <p>
          Receipts puts them in one place and is honest about each one, so you can find a case that fits your argument,
          know exactly how much weight it can bear, and point people to it.
        </p>

        <h2>What&rsquo;s in it</h2>
        <p>
          {n} receipts from {orgs} organizations. {strong} have tested or measured results; {decisions} are decisions
          research changed, such as a feature that was never built. {independent} come from independent sources, and{" "}
          {vendor} are vendor or agency accounts of their own client work, which are flagged on every card because the
          teller has an incentive.
        </p>
        <p>
          <Link href="/how-we-rate">How we rate</Link> explains the evidence levels and source labels in full.
        </p>

        <h2>How cases get in</h2>
        <ul>
          <li>Every published case links to at least one public source we opened and checked.</li>
          <li>Entries summarize the research and quote numbers exactly as the source reports them.</li>
          <li>
            New public cases are gathered every month, and community submissions are welcome. Nothing is published
            until it has been reviewed.
          </li>
        </ul>

        <h2>Who makes it</h2>
        <p>
          Receipts is made by Jess Holbrook, a UX research leader. The code and the data behind it are open on{" "}
          <a href="https://github.com/jessholbrook/receipts">GitHub</a>.
        </p>

        <h2>Get involved</h2>
        <ul>
          <li>
            Know a case that belongs here? <Link href="/submit">Submit a win</Link>. Anonymized cases are welcome.
          </li>
          <li>
            Spot an error or a better source?{" "}
            <a href="https://github.com/jessholbrook/receipts/issues/new">Open an issue on GitHub</a> with the
            correction and a link.
          </li>
        </ul>
      </div>
    </div>
  );
}
