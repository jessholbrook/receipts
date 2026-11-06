// Upload validated seed entries (supabase/seed.json) via the admin-only RPC.
// Usage: RECEIPTS_ADMIN_TOKEN=... node scripts/load-seed.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iuqkvydewbmxrmuvoinx.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_lfL1h-Xyw7j1YzaZ121cgQ_l4FIQv-5";
const token = process.env.RECEIPTS_ADMIN_TOKEN;
if (!token) throw new Error("Set RECEIPTS_ADMIN_TOKEN");

const rows = JSON.parse(fs.readFileSync(path.join(root, "supabase/seed.json"), "utf8"));
const res = await fetch(`${url}/rest/v1/rpc/admin_upsert_entries`, {
  method: "POST",
  headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ token, rows }),
});
console.log(res.status, await res.text());
