// Merge data/seed/*.json, validate against the taxonomy, and emit SQL upserts.
// Usage: node scripts/build-seed.mjs [--out supabase/seed.sql]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const taxSrc = fs.readFileSync(path.join(root, "lib/taxonomy.ts"), "utf8");

function valuesOf(constName) {
  const m = taxSrc.match(new RegExp(`export const ${constName}: Option\\[\\] = \\[([\\s\\S]*?)\\n\\];`));
  if (!m) throw new Error(`taxonomy ${constName} not found`);
  return new Set([...m[1].matchAll(/value: "([a-z0-9_]+)"/g)].map((x) => x[1]));
}

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

const dir = path.join(root, "data/seed");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const all = [];
const problems = [];
for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  } catch (e) {
    problems.push(`${f}: invalid JSON (${e.message})`);
    continue;
  }
  for (const e of arr) all.push({ ...e, _file: f });
}

const seen = new Map();
const out = [];
for (const e of all) {
  const where = `${e._file}:${e.slug}`;
  const errs = [];
  if (!e.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug)) errs.push("bad slug");
  if (seen.has(e.slug)) errs.push(`duplicate slug (also in ${seen.get(e.slug)})`);
  for (const k of ["title", "company", "summary"]) if (!e[k]) errs.push(`missing ${k}`);
  for (const k of ["research_type", "industry", "product_type", "company_size", "evidence_strength", "source_type"]) {
    if (e[k] != null && !TAX[k].has(e[k])) errs.push(`${k}="${e[k]}" not in taxonomy`);
  }
  if (!TAX.evidence_strength.has(e.evidence_strength)) errs.push("evidence_strength required");
  for (const k of ["methods", "metrics"]) {
    if (!Array.isArray(e[k])) e[k] = [];
    const bad = e[k].filter((v) => !TAX[k].has(v));
    if (bad.length) {
      problems.push(`${where}: dropped unknown ${k}: ${bad.join(", ")}`);
      e[k] = e[k].filter((v) => TAX[k].has(v));
    }
  }
  // "Decision" means no metric: its headline names the decision, never a number
  if (e.evidence_strength === "decision" && /\d/.test(e.headline_metric ?? ""))
    errs.push(`decision entry has a number in headline_metric ("${e.headline_metric}")`);
  if (e.headline_metric && e.headline_metric.length > 32) errs.push("headline_metric over 32 characters");
  if (!Array.isArray(e.sources) || !e.sources.length || !e.sources.every((s) => /^https?:\/\//.test(s.url ?? "")))
    errs.push("needs at least one valid source url");
  if (errs.length) {
    problems.push(`${where}: SKIPPED — ${errs.join("; ")}`);
    continue;
  }
  seen.set(e.slug, e._file);
  out.push(e);
}

const q = (v) => (v == null || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(",")}]::text[]`;
const cols = [
  "slug", "title", "company", "is_anonymized", "summary", "problem", "research", "insight", "change", "outcome",
  "headline_metric", "attribution", "caveats", "methods", "research_type", "industry", "product_type", "metrics",
  "company_size", "year", "evidence_strength", "source_type", "sources",
];
const rows = out.map((e) =>
  `(${[
    q(e.slug), q(e.title), q(e.company), e.is_anonymized ? "true" : "false", q(e.summary), q(e.problem), q(e.research),
    q(e.insight), q(e.change), q(e.outcome), q(e.headline_metric), q(e.attribution), q(e.caveats), arr(e.methods),
    q(e.research_type), q(e.industry), q(e.product_type), arr(e.metrics), q(e.company_size),
    Number.isInteger(e.year) ? e.year : "null", q(e.evidence_strength), q(e.source_type),
    `${q(JSON.stringify(e.sources))}::jsonb`,
  ].join(", ")})`,
);

const sql = rows.length
  ? `insert into public.entries (${cols.join(", ")}) values\n${rows.join(",\n")}\non conflict (slug) do update set ${cols
      .filter((c) => c !== "slug")
      .map((c) => `${c} = excluded.${c}`)
      .join(", ")};\n`
  : "-- no rows\n";

const outPath = path.join(root, process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "supabase/seed.sql");
fs.writeFileSync(outPath, sql);
fs.writeFileSync(path.join(root, "supabase/seed.json"), JSON.stringify(out.map((e) => { const copy = { ...e }; delete copy._file; return copy; }), null, 1));

const by = (k) => out.reduce((m, e) => ((m[e[k]] = (m[e[k]] ?? 0) + 1), m), {});
console.log(`files: ${files.join(", ")}`);
console.log(`entries: ${out.length} valid / ${all.length} total`);
console.log("evidence:", by("evidence_strength"));
console.log("source:", by("source_type"));
console.log("industry:", by("industry"));
if (problems.length) console.log("\nproblems:\n  " + problems.join("\n  "));
console.log(`\nwrote ${path.relative(root, outPath)}`);
