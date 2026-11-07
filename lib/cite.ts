import type { Entry } from "./types";
import { EVIDENCE, SOURCE_TYPES } from "./taxonomy";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.researchreceipts.org";

export const entryUrl = (slug: string) => `${SITE}/entries/${slug}`;

const firstSentence = (text: string | null) => (text ? text.trim().split(/(?<=[.!?])\s+/)[0] : null);

// Plain text that pastes cleanly into Slack, docs and slides, and carries the same
// honesty labels as the site: evidence level, who is telling the story, the main caveat.
export function buildCitation(e: Entry): string {
  const ev = EVIDENCE.find((x) => x.value === e.evidence_strength);
  const src = SOURCE_TYPES.find((x) => x.value === e.source_type);
  const first = e.sources[0];
  const caveat = firstSentence(e.caveats);
  return [
    `${e.headline_metric ? `${e.headline_metric}: ` : ""}${e.title}`,
    `${e.company}${e.year ? `, ${e.year}` : ""}.`,
    `Evidence: ${ev?.label} (${ev?.short}). Source: ${src?.short}.`,
    caveat ? `Caveat: ${caveat}` : null,
    first ? `Read it: ${first.title}${first.publisher ? `, ${first.publisher}` : ""}. ${first.url}` : null,
    `Via Receipts: ${entryUrl(e.slug)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
