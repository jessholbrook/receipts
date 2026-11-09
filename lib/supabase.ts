import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Entry } from "./types";

// Publishable (anon) key: safe to expose. All access control lives in Postgres RLS
// and security-definer functions (see supabase/migrations).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iuqkvydewbmxrmuvoinx.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_lfL1h-Xyw7j1YzaZ121cgQ_l4FIQv-5";

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

const ENTRY_COLUMNS =
  "slug,title,company,is_anonymized,summary,problem,research,insight,change,outcome,headline_metric,attribution,caveats,methods,research_type,industry,product_type,metrics,company_size,year,year_approx,evidence_strength,source_type,sources,verified_by,image_url,created_at";

export async function getEntries(): Promise<Entry[]> {
  const { data, error } = await supabase()
    .from("entries")
    .select(ENTRY_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Entry[];
}

// The homepage renders per request (filtered links get their own preview card), and link
// unfurlers hit it often, so the full list is cached for five minutes. Approving a submission
// clears it via the "entries" tag.
export const getEntriesCached = unstable_cache(getEntries, ["entries"], { revalidate: 300, tags: ["entries"] });

export async function getEntry(slug: string): Promise<Entry | null> {
  const { data, error } = await supabase().from("entries").select(ENTRY_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Entry) ?? null;
}
