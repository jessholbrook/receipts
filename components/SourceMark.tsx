import type { Entry } from "@/lib/types";

// Who is telling the story, at the same weight as the evidence level. A vendor or agency
// writing about its own client is flagged; the others are labelled plainly.
const MARK: Record<Entry["source_type"], { text: string; tone: string }> = {
  agency_vendor: { text: "Vendor account · has an incentive", tone: "vendor" },
  first_party: { text: "Company's own account", tone: "own" },
  independent: { text: "Independent source", tone: "independent" },
  community: { text: "Community submission", tone: "own" },
};

export default function SourceMark({ type }: { type: Entry["source_type"] }) {
  const m = MARK[type];
  return (
    <span className={`src-mark src-${m.tone}`}>
      {m.tone === "vendor" && (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M8 1.5 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 6v3.6M8 11.6v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
      {m.tone === "independent" && (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {m.text}
    </span>
  );
}

// "9 independent, 3 company's own, 2 vendor" or "all vendor accounts"
export function sourceBreakdown(items: Pick<Entry, "source_type">[]): string {
  const c = { independent: 0, first_party: 0, community: 0, agency_vendor: 0 };
  for (const e of items) c[e.source_type]++;
  const n = items.length;
  const word: Record<keyof typeof c, [string, string]> = {
    independent: ["independent", "independent sources"],
    first_party: ["company's own", "company accounts"],
    community: ["community", "community submissions"],
    agency_vendor: ["vendor", "vendor accounts"],
  };
  const keys = (Object.keys(c) as (keyof typeof c)[]).filter((k) => c[k] > 0);
  if (n > 1 && keys.length === 1) return `all ${word[keys[0]][1]}`;
  return keys.map((k) => `${c[k]} ${word[k][0]}`).join(", ");
}
