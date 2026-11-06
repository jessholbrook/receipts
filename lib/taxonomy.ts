// Canonical taxonomy. Keep docs/taxonomy.md in sync.

export type Option = { value: string; label: string; description?: string };

export const METHODS: Option[] = [
  { value: "usability_testing", label: "Usability testing" },
  { value: "interviews", label: "User interviews" },
  { value: "field_study", label: "Field study / contextual inquiry" },
  { value: "ethnography", label: "Ethnography" },
  { value: "diary_study", label: "Diary study" },
  { value: "survey", label: "Survey" },
  { value: "card_sorting", label: "Card sorting / tree testing" },
  { value: "concept_testing", label: "Concept / prototype testing" },
  { value: "analytics", label: "Behavioral analytics" },
  { value: "experimentation", label: "A/B testing / experimentation" },
  { value: "co_design", label: "Participatory / co-design" },
  { value: "journey_mapping", label: "Journey / service mapping" },
  { value: "heuristic_review", label: "Expert / heuristic review" },
  { value: "eye_tracking", label: "Eye tracking" },
  { value: "benchmarking", label: "UX benchmarking" },
  { value: "accessibility_research", label: "Accessibility research" },
  { value: "support_analysis", label: "Support / feedback analysis" },
];

export const RESEARCH_TYPES: Option[] = [
  { value: "generative", label: "Generative", description: "Discovering needs and opportunities" },
  { value: "evaluative", label: "Evaluative", description: "Testing a design or product" },
  { value: "mixed", label: "Mixed" },
];

export const INDUSTRIES: Option[] = [
  { value: "ecommerce_retail", label: "E-commerce & retail" },
  { value: "finance", label: "Banking & fintech" },
  { value: "insurance", label: "Insurance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "government", label: "Government & public sector" },
  { value: "saas_b2b", label: "SaaS & B2B" },
  { value: "consumer_tech", label: "Consumer tech & social" },
  { value: "media_entertainment", label: "Media & entertainment" },
  { value: "travel_hospitality", label: "Travel & hospitality" },
  { value: "education", label: "Education" },
  { value: "telecom", label: "Telecom" },
  { value: "transportation", label: "Transportation & automotive" },
  { value: "gaming", label: "Gaming" },
  { value: "food_delivery", label: "Food & delivery" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "energy_utilities", label: "Energy & utilities" },
  { value: "real_estate", label: "Real estate" },
  { value: "hardware", label: "Hardware & devices" },
  { value: "consumer_goods", label: "Consumer goods" },
];

export const PRODUCT_TYPES: Option[] = [
  { value: "website", label: "Website / marketing site" },
  { value: "web_app", label: "Web app" },
  { value: "mobile_app", label: "Mobile app" },
  { value: "checkout_flow", label: "Checkout / sign-up flow" },
  { value: "enterprise_software", label: "Enterprise software" },
  { value: "physical_product", label: "Physical product / hardware" },
  { value: "service", label: "Service / omnichannel" },
  { value: "internal_tool", label: "Internal tool" },
  { value: "ai_product", label: "AI product" },
  { value: "public_service", label: "Public digital service" },
  { value: "game", label: "Video game" },
  { value: "desktop_software", label: "Desktop software" },
];

export const METRICS: Option[] = [
  { value: "revenue", label: "Revenue" },
  { value: "conversion", label: "Conversion" },
  { value: "retention", label: "Retention / churn" },
  { value: "engagement", label: "Engagement" },
  { value: "task_success", label: "Task success / efficiency" },
  { value: "support_cost", label: "Support volume / cost" },
  { value: "cost_avoided", label: "Cost avoided" },
  { value: "satisfaction", label: "Satisfaction (NPS/CSAT)" },
  { value: "adoption", label: "Adoption" },
  { value: "errors", label: "Error rate" },
  { value: "accessibility", label: "Accessibility / inclusion" },
  { value: "time_to_market", label: "Time to market" },
];

export const COMPANY_SIZES: Option[] = [
  { value: "startup", label: "Startup (<200)" },
  { value: "midmarket", label: "Mid-market" },
  { value: "enterprise", label: "Enterprise" },
  { value: "public_sector", label: "Public sector" },
  { value: "undisclosed", label: "Undisclosed" },
];

export const EVIDENCE: Option[] = [
  {
    value: "tested",
    label: "Tested",
    description: "Controlled experiment or A/B test tied to the research-driven change.",
  },
  {
    value: "measured",
    label: "Measured",
    description: "Before/after metrics, but no control group.",
  },
  {
    value: "reported",
    label: "Reported",
    description: "The company states an outcome but doesn't share how it was measured.",
  },
  {
    value: "decision",
    label: "Decision",
    description: "Research changed a decision (killed, pivoted, re-prioritized). No metric.",
  },
];

export const SOURCE_TYPES: Option[] = [
  { value: "first_party", label: "Company's own account", description: "The company's own blog, talk or report." },
  {
    value: "agency_vendor",
    label: "Agency / vendor",
    description: "A consultancy or tool vendor writing about its own client work. Has an incentive.",
  },
  { value: "independent", label: "Independent", description: "Journalism, academic work, audits, books." },
  { value: "community", label: "Community submission", description: "Submitted to Receipts by a practitioner." },
];

export type FacetKey =
  | "evidence_strength"
  | "methods"
  | "research_type"
  | "industry"
  | "product_type"
  | "metrics"
  | "company_size"
  | "source_type";

export const FACETS: { key: FacetKey; label: string; options: Option[]; multi: boolean }[] = [
  { key: "evidence_strength", label: "Evidence", options: EVIDENCE, multi: false },
  { key: "methods", label: "Method", options: METHODS, multi: true },
  { key: "industry", label: "Industry", options: INDUSTRIES, multi: false },
  { key: "metrics", label: "Metric", options: METRICS, multi: true },
  { key: "research_type", label: "Research type", options: RESEARCH_TYPES, multi: false },
  { key: "product_type", label: "Product type", options: PRODUCT_TYPES, multi: false },
  { key: "company_size", label: "Company size", options: COMPANY_SIZES, multi: false },
  { key: "source_type", label: "Source", options: SOURCE_TYPES, multi: false },
];

const ALL: Record<string, Option[]> = {
  methods: METHODS,
  research_type: RESEARCH_TYPES,
  industry: INDUSTRIES,
  product_type: PRODUCT_TYPES,
  metrics: METRICS,
  company_size: COMPANY_SIZES,
  evidence_strength: EVIDENCE,
  source_type: SOURCE_TYPES,
};

export function labelFor(facet: string, value: string | null | undefined): string {
  if (!value) return "";
  return ALL[facet]?.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ");
}

export function isValid(facet: string, value: string): boolean {
  return !!ALL[facet]?.some((o) => o.value === value);
}
