import Link from "next/link";

// What to check before approving a submission. Built from what the source audits of the seed data
// actually caught, so each item names the failure it prevents.
const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Open every source as a reader would",
    body: (
      <>
        A page can load and still fail the reader: results buried under status updates, sections collapsed on a
        phone, a number on page 11 of a PDF. If the evidence is deep, link to the section (<code>#Impact</code>) or
        PDF page (<code>#page=11</code>). Bot-check walls are fine; real 404s are not.
      </>
    ),
  },
  {
    title: "Find the headline number, word for word, in the first source",
    body: (
      <>
        Search for the number with its unit (&ldquo;160%&rdquo;, not &ldquo;160&rdquo;). It must be stated, not
        derived: 52% + 40% is not &ldquo;92%&rdquo;. Put the source that states it first, since citations and
        &ldquo;Read it&rdquo; use the first link.
      </>
    ),
  },
  {
    title: "Check the last sentence of each section hardest",
    body: (
      <>
        This is where unsupported claims hide. Every claim the audits removed was a plausible extra detail at the
        end of an otherwise accurate paragraph (&ldquo;art style alone added 5%&rdquo;, &ldquo;won an RNIB
        award&rdquo;), usually from a different source than the one cited. If you can&rsquo;t find it in a listed
        source, cut it.
      </>
    ),
  },
  {
    title: "Match the verb to what happened",
    body: (
      <>
        For Decision entries, the headline names the decision, so the verb carries the claim. &ldquo;Dropped the
        native app&rdquo; implies there was one; the source said they decided not to build it.
      </>
    ),
  },
  {
    title: "Rate the evidence the source supports, not the story",
    body: (
      <>
        Tested, Measured, Reported or Decision, per <Link href="/how-we-rate">How we rate</Link>. A vendor case
        study is source type <code>agency_vendor</code>, whatever the numbers say.
      </>
    ),
  },
  {
    title: "Cite originals only",
    body: (
      <>
        No archive.org, cached copies, mirrors or paywall bypasses. If the original is gone, find where it moved;
        if it&rsquo;s nowhere, the claim needs another source or comes out.
      </>
    ),
  },
];

export default function ReviewChecklist({ open }: { open: boolean }) {
  return (
    <details className="checklist" open={open}>
      <summary>Review checklist</summary>
      <ol>
        {STEPS.map((s) => (
          <li key={s.title}>
            <strong>{s.title}.</strong> {s.body}
          </li>
        ))}
      </ol>
    </details>
  );
}
