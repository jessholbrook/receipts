// Find a card thumbnail for each entry: the og:image (or twitter:image) its source page
// publishes for link previews. Generic images are dropped:
//   - the same image used by 2+ entries (a site-wide default), or
//   - the same image the source site's homepage uses (a site logo/banner), or
//   - the entry's slug is listed in data/thumbnail-blocklist.json (manual veto).
// Writes data/thumbnails.json; with RECEIPTS_ADMIN_TOKEN set, also saves to the database.
//
// Usage: [RECEIPTS_ADMIN_TOKEN=...] node scripts/fetch-thumbnails.mjs [--only-missing]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iuqkvydewbmxrmuvoinx.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_lfL1h-Xyw7j1YzaZ121cgQ_l4FIQv-5";
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const onlyMissing = process.argv.includes("--only-missing");

async function fetchText(u, ms = 20000) {
  try {
    const res = await fetch(u, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) return null;
    return { html: (await res.text()).slice(0, 400000), finalUrl: res.url };
  } catch {
    return null;
  }
}

function metaImage(html, base) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const want of ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]) {
    for (const t of tags) {
      const name = t.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (name !== want) continue;
      const content = t.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
      if (!content) continue;
      try {
        return new URL(content.replace(/&amp;/g, "&").trim(), base).href;
      } catch {
        /* bad url */
      }
    }
  }
  return null;
}

async function imageOk(u) {
  if (!u.startsWith("https://")) return false;
  try {
    const res = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return false;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 6000; // tiny files are icons/spacers
  } catch {
    return false;
  }
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

const entries = await (await fetch(`${url}/rest/v1/entries?select=slug,sources,image_url`, { headers })).json();
const todo = onlyMissing ? entries.filter((e) => !e.image_url) : entries;
console.log(`checking ${todo.length} entries`);

const homeCache = new Map();
async function homeImage(origin) {
  if (!homeCache.has(origin)) {
    homeCache.set(
      origin,
      fetchText(origin + "/").then((r) => (r ? metaImage(r.html, r.finalUrl) : null)),
    );
  }
  return homeCache.get(origin);
}

const found = await pool(todo, 8, async (e) => {
  for (const s of e.sources ?? []) {
    const page = await fetchText(s.url);
    if (!page) continue;
    const img = metaImage(page.html, page.finalUrl);
    if (!img) continue;
    const origin = new URL(page.finalUrl).origin;
    const home = await homeImage(origin);
    if (home && home === img) continue; // site-wide default
    return { slug: e.slug, img };
  }
  return { slug: e.slug, img: null };
});

// drop images shared across entries (site defaults the homepage check missed)
const counts = {};
for (const f of found) if (f.img) counts[f.img] = (counts[f.img] ?? 0) + 1;
const candidates = found.filter((f) => f.img && counts[f.img] === 1);

const verified = await pool(candidates, 8, async (f) => ((await imageOk(f.img)) ? f : null));
// manual vetoes: images that passed the checks but don't fit (stock art, logos, data tables)
const blockPath = path.join(root, "data/thumbnail-blocklist.json");
const blocked = new Set(fs.existsSync(blockPath) ? JSON.parse(fs.readFileSync(blockPath, "utf8")) : []);
const map = {};
for (const f of found) map[f.slug] = null;
for (const f of verified) if (f && !blocked.has(f.slug)) map[f.slug] = f.img;

const outPath = path.join(root, "data/thumbnails.json");
const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
const merged = onlyMissing ? { ...prev, ...Object.fromEntries(Object.entries(map).filter(([, v]) => v)) } : map;
fs.writeFileSync(outPath, JSON.stringify(merged, null, 1) + "\n");

const got = Object.values(map).filter(Boolean).length;
const shared = found.filter((f) => f.img && counts[f.img] > 1).length;
console.log(`thumbnails: ${got}/${todo.length} (dropped ${shared} shared/default images)`);

if (process.env.RECEIPTS_ADMIN_TOKEN) {
  const res = await fetch(`${url}/rest/v1/rpc/admin_set_images`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: process.env.RECEIPTS_ADMIN_TOKEN, images: onlyMissing ? Object.fromEntries(Object.entries(map).filter(([, v]) => v)) : map }),
  });
  console.log("saved:", res.status, await res.text());
}
