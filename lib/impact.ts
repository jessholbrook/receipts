import assignments from "@/data/impact-groups.json";
import type { Entry } from "./types";

export const IMPACT_GROUPS = [
  { id: "growth", label: "Help a business grow", description: "Revenue, conversion and retention" },
  { id: "access", label: "Open up access", description: "Inclusion and access to services" },
  { id: "risk", label: "Reduce mistakes & risk", description: "Errors, harm and avoided investment" },
  { id: "experience", label: "Make products work better", description: "Everyday use and product decisions" },
  { id: "unassigned", label: "Not yet grouped", description: "New receipts awaiting an editorial placement" },
] as const;
export type ImpactGroup = (typeof IMPACT_GROUPS)[number]["id"];

// One editorial home per receipt, not a claim that its benefits are exclusive.
// Keep new receipts visible without guessing their contribution from keywords.
export function impactGroup(entry: Pick<Entry, "slug">): ImpactGroup {
  const id = (assignments as Record<string, string>)[entry.slug];
  return IMPACT_GROUPS.find((g) => g.id === id)?.id ?? "unassigned";
}
