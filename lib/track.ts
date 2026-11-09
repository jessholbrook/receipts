// Anonymous product events, stored in our own database (see supabase/migrations/0006_events.sql).
// No cookies, no ids, no IP storage. Skipped entirely when the visitor asks not to be tracked,
// and on local dev unless localStorage "receipts-track-local" is "1".

export type EventName =
  | "copy_citation"
  | "copy_link"
  | "copy_results_link"
  | "source_click"
  | "lucky"
  | "filter"
  | "search"
  | "sheet_open"
  | "show_all"
  | "submit_success"
  | "share_landing";

const URL_ = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iuqkvydewbmxrmuvoinx.supabase.co") + "/rest/v1/events";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_lfL1h-Xyw7j1YzaZ121cgQ_l4FIQv-5";

function allowed(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return false;
  if (["localhost", "127.0.0.1"].includes(location.hostname)) {
    try {
      return localStorage.getItem("receipts-track-local") === "1";
    } catch {
      return false;
    }
  }
  return true;
}

export function track(name: EventName, props: Record<string, string | number | boolean> = {}): void {
  if (!allowed()) return;
  try {
    void fetch(URL_, {
      method: "POST",
      keepalive: true, // survives navigating away (source links, Lucky)
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name, path: location.pathname.slice(0, 300), props }),
    }).catch(() => {});
  } catch {
    /* never let analytics break the page */
  }
}
