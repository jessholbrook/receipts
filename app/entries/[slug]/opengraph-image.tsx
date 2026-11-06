import { renderOg, OG_SIZE } from "@/lib/og";
import { getEntry } from "@/lib/supabase";
import { labelFor } from "@/lib/taxonomy";

export const alt = "A Receipts entry";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEntry(slug);
  if (!e) return renderOg({ title: "What has UX research ever done for us?" });
  return renderOg({
    kicker: [labelFor("industry", e.industry), e.year].filter(Boolean).join(" · "),
    title: e.title,
    company: e.company,
    metric: e.headline_metric ?? (e.evidence_strength === "decision" ? "Decision changed" : null),
    evidence: e.evidence_strength,
  });
}
