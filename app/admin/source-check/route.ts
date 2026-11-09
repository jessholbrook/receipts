import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runSourceCheck } from "@/lib/sourcecheck";

// Fetches submitter-supplied URLs, so it's moderator-only: the admin cookie (scoped to /admin) must
// hold a passphrase the database accepts. lib/sourcecheck.ts refuses private/internal addresses on
// every redirect hop and caps size and time.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = (await cookies()).get("receipts_admin")?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { data: ok, error } = await supabase().rpc("admin_check", { token });
  if (error || ok !== true) return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });

  let entry: unknown;
  try {
    entry = (await req.json())?.entry;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  if (!entry || typeof entry !== "object" || Array.isArray(entry))
    return NextResponse.json({ error: "Entry JSON didn't parse into an object." }, { status: 400 });

  const report = await runSourceCheck(entry as Record<string, unknown>);
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
}
