import { renderOg, OG_SIZE } from "@/lib/og";
import { getEntry } from "@/lib/supabase";
import { EVIDENCE, labelFor } from "@/lib/taxonomy";
import { yearLabel } from "@/lib/cite";

export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

const SOURCE_TEXT: Record<string, string> = {
  agency_vendor: "Vendor account · has an incentive",
  first_party: "Company's own account",
  independent: "Independent source",
  community: "Community submission",
};

// The share image carries the same honesty labels as the page: evidence level,
// who is telling the story, and an approximate year marked as approximate.
export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEntry(slug);
  const alt = e
    ? [
        EVIDENCE.find((x) => x.value === e.evidence_strength)?.label,
        SOURCE_TEXT[e.source_type],
        e.headline_metric,
        `${e.company}${e.year ? `, ${yearLabel(e)}` : ""}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "A Receipts entry";
  return [{ id: "card", alt, size: OG_SIZE, contentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEntry(slug);
  if (!e) return renderOg({ title: "What has UX research ever done for us?" });
  return renderOg({
    kicker: [labelFor("industry", e.industry), yearLabel(e)].filter(Boolean).join(" · "),
    title: e.title,
    company: e.company,
    source: { text: SOURCE_TEXT[e.source_type], vendor: e.source_type === "agency_vendor" },
    metric: e.headline_metric,
    resultLabel: "RESULT",
    evidence: e.evidence_strength,
  });
}
