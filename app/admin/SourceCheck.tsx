"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClaimResult, SourceCheckReport } from "@/lib/sourcecheck";

const FIELD_LABELS: Record<string, string> = {
  headline_metric: "Headline result",
  summary: "Summary",
  outcome: "Outcome",
  insight: "Insight",
  change: "Change",
  research: "Research",
  problem: "Problem",
  caveats: "Caveats",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "Read",
  blocked: "Couldn't read",
  dead: "Dead",
  error: "Error",
  unsafe: "Not fetched",
};

function host(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

function Snippet({ text, hit }: { text: string; hit: string }) {
  const i = text.indexOf(hit);
  if (i < 0) return <>…{text}…</>;
  return (
    <>
      …{text.slice(0, i)}
      <mark>{hit}</mark>
      {text.slice(i + hit.length)}…
    </>
  );
}

function ClaimRow({ c, sources }: { c: ClaimResult; sources: SourceCheckReport["sources"] }) {
  const f = c.found;
  const state = f ? "found" : c.hedged ? "hedged" : "missing";
  const where = f
    ? [
        `source ${f.source + 1}`,
        f.page ? `p. ${f.page}` : null,
        f.anchor && !f.page ? `near #${f.anchor}` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : null;
  return (
    <li className={`sc-claim sc-${state}`}>
      <span className="sc-mark" aria-hidden="true">
        {f ? "✓" : c.hedged ? "~" : "✗"}
      </span>
      <div>
        <div className="sc-claim-head">
          <strong className="mono">{c.text}</strong>
          <span className="sc-where">
            {f ? (
              <a href={sources[f.source]?.url} target="_blank" rel="noreferrer">
                {where}
              </a>
            ) : c.hedged ? (
              "not found; the entry already says it's unverified"
            ) : (
              "not found in the readable sources"
            )}
          </span>
          {c.tail && <span className="sc-tag">last sentence</span>}
        </div>
        <p className="sc-snippet">
          {f ? <Snippet text={f.snippet} hit={f.hit} /> : <>Entry: “{c.context}”</>}
        </p>
      </div>
    </li>
  );
}

export default function SourceCheck({ entry, textareaId }: { entry: unknown; textareaId: string }) {
  const [report, setReport] = useState<SourceCheckReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(
    async (useEdited: boolean) => {
      setRunning(true);
      setError(null);
      let body = entry;
      if (useEdited) {
        const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
        try {
          body = JSON.parse(el?.value ?? "");
        } catch {
          setRunning(false);
          setError("The entry JSON doesn't parse, so it can't be checked. Fix it and try again.");
          return;
        }
      }
      try {
        const res = await fetch("/admin/source-check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ entry: body }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setReport(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The check failed.");
      } finally {
        setRunning(false);
      }
    },
    [entry, textareaId],
  );

  useEffect(() => {
    run(false);
  }, [run]);

  const all = report?.claims ?? [];
  const claims = all.filter((c) => c.key);
  const minor = all.filter((c) => !c.key);
  const found = claims.filter((c) => c.found).length;
  const byField = Object.keys(FIELD_LABELS)
    .map((k) => ({ k, items: claims.filter((c) => c.field === k) }))
    .filter((g) => g.items.length);

  return (
    <section className="source-check" aria-label="Source check" aria-busy={running}>
      <div className="sc-top">
        <h3>Source check</h3>
        <span className="sc-meta" role="status">
          {running
            ? "Checking sources…"
            : report
              ? `${found} of ${claims.length} key figures found · ${new Date(report.checkedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : null}
        </span>
        <button type="button" className="btn secondary sc-rerun" onClick={() => run(true)} disabled={running}>
          Re-check edited JSON
        </button>
      </div>

      {error && <div className="notice error">{error}</div>}

      {report && (
        <>
          {report.warnings.length > 0 ? (
            <ul className="sc-warnings">
              {report.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="sc-clear">
              Every key figure was found in a readable source. Still read the sentences: a match isn&rsquo;t proof the
              source says the same thing.
            </p>
          )}

          <ol className="sc-sources">
            {report.sources.map((s, i) => (
              <li key={i}>
                <span className={`sc-status sc-status-${s.status}`}>{STATUS_LABEL[s.status]}</span>{" "}
                <a href={s.url} target="_blank" rel="noreferrer">
                  {host(s.url)}
                </a>
                {s.title && <span className="sc-title"> · {s.title}</span>}
                {s.note && <span className="sc-note"> · {s.note}</span>}
              </li>
            ))}
          </ol>

          {report.decision && (
            <p className="sc-decision">
              Decision headline, so no number to match. Words found in the sources:{" "}
              {report.decision.words.map((w, i) => (
                <span key={w.word} className={w.found ? "sc-w-found" : "sc-w-missing"}>
                  {i ? ", " : ""}
                  {w.word} {w.found ? "✓" : "✗"}
                </span>
              ))}
              . Check the verb matches what happened.
            </p>
          )}

          {byField.map((g) => (
            <div key={g.k} className="sc-field">
              <h4>{FIELD_LABELS[g.k]}</h4>
              <ul>
                {g.items.map((c, i) => (
                  <ClaimRow key={i} c={c} sources={report.sources} />
                ))}
              </ul>
            </div>
          ))}

          {minor.length > 0 && (
            <details className="sc-minor">
              <summary>
                Other numbers: dates, counts, versions ({minor.filter((c) => c.found).length} of {minor.length} found)
              </summary>
              <ul>
                {minor.map((c, i) => (
                  <ClaimRow key={i} c={c} sources={report.sources} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
