export type Source = { title: string; url: string; publisher?: string; date?: string };

export type Entry = {
  slug: string;
  title: string;
  company: string;
  is_anonymized: boolean;
  summary: string;
  problem: string | null;
  research: string | null;
  insight: string | null;
  change: string | null;
  outcome: string | null;
  headline_metric: string | null;
  attribution: string | null;
  caveats: string | null;
  methods: string[];
  research_type: string | null;
  industry: string | null;
  product_type: string | null;
  metrics: string[];
  company_size: string | null;
  year: number | null;
  evidence_strength: "tested" | "measured" | "reported" | "decision";
  source_type: "first_party" | "agency_vendor" | "independent" | "community";
  sources: Source[];
  verified_by: string | null;
  image_url: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  submitter_name: string | null;
  submitter_email: string;
  verified_by: string | null;
  entry: Partial<Entry> & Record<string, unknown>;
  moderator_note: string | null;
  reviewed_at: string | null;
};
