// Submit candidate entries found by the monthly scout to the review queue.
// Uses the public insert-only path (same as the website form). Nothing is published
// until a moderator approves it at /admin.
//
// Usage: node scripts/scout-submit.mjs path/to/candidates.json [--dry-run]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iuqkvydewbmxrmuvoinx.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_lfL1h-Xyw7j1YzaZ121cgQ_l4FIQv-5";
const SCOUT_EMAIL = "scout@receipts.bot";
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const file = process.argv[2];
const dry = process.argv.includes("--dry-run");
if (!file) throw new Error("usage: node scripts/scout-submit.mjs candidates.json [--dry-run]");

const taxSrc = fs.readFileSync(path.join(root, "lib/taxonomy.ts"), "utf8");
const valuesOf = (c) =>
  new Set([...taxSrc.match(new RegExp(`export const ${c}: Option\\[\\] = \\[([\\s\\S]*?)\\n\\];`))[1].matchAll(/value: "([a-z0-9_]+)"/g)].map((m) => m[1]));
const TAX = {
  methods: valuesOf("METHODS"),
  research_type: valuesOf("RESEARCH_TYPES"),
  industry: valuesOf("INDUSTRIES"),
  product_type: valuesOf("PRODUCT_TYPES"),
  metrics: valuesOf("METRICS"),
  company_size: valuesOf("COMPANY_SIZES"),
  evidence_strength: valuesOf("EVIDENCE"),
  source_type: valuesOf("SOURCE_TYPES"),
};

const get = async (p) => (await fetch(`${url}/rest/v1/${p}`, { headers })).json();
const existing = new Set((await get("entries?select=slug")).map((r) => r.slug));
const already = new Set(
  await (await fetch(`${url}/rest/v1/rpc/scout_submitted_slugs`, { method: "POST", headers, body: "{}" })).json(),
);
const existingUrls = new Set(
  (await get("entries?select=sources")).flatMap((r) => r.sources.map((s) => s.url.replace(/\/$/, ""))),
);

const candidates = JSON.parse(fs.readFileSync(file, "utf8"));
let sent = 0;
for (const e of candidates) {
  const errs = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug ?? "")) errs.push("bad slug");
  if (existing.has(e.slug)) errs.push("already published");
  if (already.has(e.slug)) errs.push("already submitted by scout");
  if (e.sources?.some((s) => existingUrls.has(s.url.replace(/\/$/, "")))) errs.push("source already used by a published entry");
  for (const k of ["title", "company", "summary"]) if (!e[k]) errs.push(`missing ${k}`);
  for (const k of ["research_type", "industry", "product_type", "company_size", "evidence_strength", "source_type"])
    if (e[k] != null && !TAX[k].has(e[k])) errs.push(`${k}=${e[k]} invalid`);
  for (const k of ["methods", "metrics"]) if (!Array.isArray(e[k]) || e[k].some((v) => !TAX[k].has(v))) errs.push(`${k} invalid`);
  if (e.evidence_strength === "decision" && /\d/.test(e.headline_metric ?? ""))
    errs.push("decision entries name the decision, not a number");
  if (e.headline_metric && e.headline_metric.length > 32) errs.push("headline_metric over 32 chars");
  if (!e.sources?.length || !e.sources.every((s) => /^https?:\/\//.test(s.url))) errs.push("needs source urls");
  if (errs.length) {
    console.log(`skip ${e.slug}: ${errs.join("; ")}`);
    continue;
  }
  if (dry) {
    console.log(`ok   ${e.slug} (dry run)`);
    continue;
  }
  const res = await fetch(`${url}/rest/v1/submissions`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      submitter_email: SCOUT_EMAIL,
      submitter_name: "Receipts monthly scout (automated)",
      verified_by: null,
      entry: e,
    }),
  });
  console.log(`${res.ok ? "sent" : "FAIL"} ${e.slug}${res.ok ? "" : " " + (await res.text())}`);
  if (res.ok) sent++;
}
console.log(`\n${sent} submitted to the review queue.`);
