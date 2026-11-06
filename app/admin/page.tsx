import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Submission } from "@/lib/types";
import { approve, getToken, logout, reject } from "./actions";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

const TABS = ["pending", "approved", "rejected", "all"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; ok?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const token = await getToken();

  if (!token) {
    return (
      <div className="wrap">
        <div className="prose">
          <h1>Moderation</h1>
        </div>
        <LoginForm />
      </div>
    );
  }

  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? sp.tab! : "pending";
  const { data, error } = await supabase().rpc("admin_list_submissions", { token, which: tab });
  const items = (data ?? []) as Submission[];

  return (
    <div className="wrap">
      <div className="prose" style={{ maxWidth: "none" }}>
        <h1>Moderation queue</h1>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <nav className="tabs" aria-label="Submission status">
          {TABS.map((t) => (
            <Link key={t} href={`/admin?tab=${t}`} aria-current={t === tab ? "page" : undefined}>
              {t}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="btn secondary">Sign out</button>
        </form>
      </div>

      {sp.ok && <div className="notice ok" style={{ marginBottom: 16 }}>{sp.ok}</div>}
      {sp.err && <div className="notice error" style={{ marginBottom: 16 }}>{sp.err}</div>}
      {error && (
        <div className="notice error" style={{ marginBottom: 16 }}>
          {error.message.includes("not authorized") ? (
            <>
              Session expired.{" "}
              <form action={logout} style={{ display: "inline" }}>
                <button className="facet-more">Sign in again</button>
              </form>
            </>
          ) : (
            error.message
          )}
        </div>
      )}

      {!error && items.length === 0 && <div className="empty">Nothing here.</div>}

      <div className="queue">
        {items.map((s) => (
          <article key={s.id} className="queue-item">
            <div className="receipt-top" style={{ marginBottom: 6 }}>
              <span>
                {s.status} · {new Date(s.created_at).toLocaleString("en-US")}
              </span>
              <span className={`ev ev-${s.entry.evidence_strength ?? "reported"}`}>
                {String(s.entry.evidence_strength ?? "")}
              </span>
            </div>
            <h2 className="serif" style={{ margin: "4px 0" }}>
              {String(s.entry.title ?? "(untitled)")}
            </h2>
            <p style={{ margin: "0 0 8px", color: "var(--ink-2)" }}>
              {String(s.entry.company ?? "")} · from {s.submitter_name ?? "anonymous"} &lt;{s.submitter_email}&gt;
              {s.verified_by ? ` · verified by ${s.verified_by}` : ""}
            </p>
            <p style={{ margin: "0 0 12px" }}>{String(s.entry.summary ?? "")}</p>
            {s.moderator_note && <p className="hint">Note: {s.moderator_note}</p>}

            {s.status === "pending" && (
              <div style={{ display: "grid", gap: 12 }}>
                <form action={approve} className="field">
                  <input type="hidden" name="id" value={s.id} />
                  <label htmlFor={`entry-${s.id}`}>
                    Entry as it will be published (edit the JSON to fix slug, ratings, wording)
                  </label>
                  <textarea
                    id={`entry-${s.id}`}
                    name="entry"
                    defaultValue={JSON.stringify(s.entry, null, 2)}
                    className="mono"
                    style={{ minHeight: 260, fontSize: 12 }}
                  />
                  <div>
                    <button className="btn">Approve &amp; publish</button>
                  </div>
                </form>
                <form action={reject} style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="field">
                  <input type="hidden" name="id" value={s.id} />
                  <input
                    type="text"
                    name="note"
                    placeholder="Reason (private)"
                    aria-label="Rejection reason"
                    style={{ flex: "1 1 240px" }}
                  />
                  <button className="btn secondary">Reject</button>
                </form>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
