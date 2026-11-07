"use server";

import { supabase } from "@/lib/supabase";
import { isValid } from "@/lib/taxonomy";

export type SubmitState = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };

const str = (fd: FormData, k: string, max = 4000) => {
  const v = fd.get(k);
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
}

export async function submitEntry(_prev: SubmitState, fd: FormData): Promise<SubmitState> {
  // honeypot
  if (str(fd, "website_hp")) return { ok: true };

  const fieldErrors: Record<string, string> = {};
  const email = str(fd, "email", 320);
  const title = str(fd, "title", 200);
  const company = str(fd, "company", 200);
  const summary = str(fd, "summary", 1500);
  const evidence = str(fd, "evidence_strength", 20);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "Enter a valid email.";
  if (title.length < 5) fieldErrors.title = "Give it a headline (at least 5 characters).";
  if (!company) fieldErrors.company = "Name the company, or describe it if anonymized.";
  if (summary.length < 30) fieldErrors.summary = "A couple of sentences, please (30+ characters).";
  if (!isValid("evidence_strength", evidence)) fieldErrors.evidence_strength = "Pick an evidence level.";
  if (evidence === "decision" && /\d/.test(str(fd, "headline_metric", 40)))
    fieldErrors.headline_metric =
      "Decision entries have no metric, so name the decision instead (e.g. “Killed the native app”).";
  if (str(fd, "consent") !== "yes") fieldErrors.consent = "Please confirm you're allowed to share this.";

  const pick = (facet: string, k = facet) => {
    const v = str(fd, k, 50);
    return v && isValid(facet, v) ? v : null;
  };
  const pickMany = (facet: string) =>
    fd
      .getAll(facet)
      .map(String)
      .filter((v) => isValid(facet, v));

  const sources = [1, 2, 3]
    .map((i) => ({ title: str(fd, `source_title_${i}`, 300), url: str(fd, `source_url_${i}`, 1000) }))
    .filter((s) => s.url)
    .map((s) => ({ title: s.title || s.url, url: s.url }));
  for (const s of sources) {
    if (!/^https?:\/\//i.test(s.url)) fieldErrors.sources = "Source links must start with http:// or https://";
  }

  const yearRaw = str(fd, "year", 4);
  const year = yearRaw ? Number(yearRaw) : null;
  if (year !== null && (!Number.isInteger(year) || year < 1950 || year > 2100)) fieldErrors.year = "Check the year.";

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, error: "A few things need fixing." };

  const entry = {
    slug: slugify(`${company} ${title}`),
    title,
    company,
    is_anonymized: str(fd, "is_anonymized") === "yes",
    summary,
    problem: str(fd, "problem") || null,
    research: str(fd, "research") || null,
    insight: str(fd, "insight") || null,
    change: str(fd, "change") || null,
    outcome: str(fd, "outcome") || null,
    headline_metric: str(fd, "headline_metric", 40) || null,
    caveats: str(fd, "caveats") || null,
    methods: pickMany("methods"),
    metrics: pickMany("metrics"),
    research_type: pick("research_type"),
    industry: pick("industry"),
    product_type: pick("product_type"),
    company_size: pick("company_size"),
    year,
    evidence_strength: evidence,
    source_type: "community",
    sources,
  };

  const { error } = await supabase()
    .from("submissions")
    .insert({
      submitter_email: email,
      submitter_name: str(fd, "name", 200) || null,
      verified_by: str(fd, "verified_by", 500) || null,
      entry,
    });

  if (error) {
    console.error("submission insert failed", error);
    return { ok: false, error: "Something went wrong saving your submission. Please try again." };
  }
  return { ok: true };
}
