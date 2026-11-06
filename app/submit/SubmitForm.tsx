"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitEntry, SubmitState } from "./actions";
import {
  COMPANY_SIZES,
  EVIDENCE,
  INDUSTRIES,
  METHODS,
  METRICS,
  PRODUCT_TYPES,
  RESEARCH_TYPES,
  Option,
} from "@/lib/taxonomy";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="hint" role="alert" style={{ color: "#dc2626" }}>
      {msg}
    </p>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: Option[] }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue="">
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Text({
  name,
  label,
  hint,
  area,
  required,
  type = "text",
  err,
  placeholder,
}: {
  name: string;
  label: string;
  hint?: string;
  area?: boolean;
  required?: boolean;
  type?: string;
  err?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required ? " *" : ""}
      </label>
      {hint && <p className="hint">{hint}</p>}
      {area ? (
        <textarea id={name} name={name} required={required} placeholder={placeholder} />
      ) : (
        <input id={name} name={name} type={type} required={required} placeholder={placeholder} />
      )}
      <Err msg={err} />
    </div>
  );
}

export default function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitEntry, { ok: false });
  const fe = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="notice ok" role="status">
        <p style={{ marginTop: 0 }}>
          <strong>Got it. Thank you.</strong> Your submission is in the review queue. We&rsquo;ll check the details and
          may email you with questions before it goes live.
        </p>
        <Link href="/">Back to all receipts</Link>
      </div>
    );
  }

  return (
    <form action={action} className="form" noValidate>
      {state.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}

      <fieldset>
        <legend>The headline</legend>
        <Text
          name="title"
          label="Headline"
          required
          err={fe.title}
          hint="Name the result, not the project. E.g. “Field visits cut onboarding drop-off by a third”."
        />
        <div className="row-2">
          <Text name="company" label="Company or organization" required err={fe.company} />
          <Text name="year" label="Year" type="number" err={fe.year} placeholder="2025" />
        </div>
        <label className="checks" style={{ fontSize: 14 }}>
          <input type="checkbox" name="is_anonymized" value="yes" /> Anonymized: I&rsquo;ve described the company
          instead of naming it (e.g. &ldquo;Fortune 500 insurer&rdquo;)
        </label>
        <Text
          name="summary"
          label="Summary"
          area
          required
          err={fe.summary}
          hint="2–3 sentences: the situation, the research, the result."
        />
        <Text
          name="headline_metric"
          label="Headline number"
          hint="Short, e.g. “+18% conversion” or “$2M avoided”. Leave blank if there's no number."
        />
      </fieldset>

      <fieldset>
        <legend>The story</legend>
        <Text name="problem" label="The problem" area hint="What was going wrong, or what did the team need to know?" />
        <Text name="research" label="The research" area hint="Who did you talk to or observe, how many, which methods?" />
        <Text name="insight" label="The insight" area hint="What did you learn that the team didn't already know?" />
        <Text name="change" label="The change" area hint="What changed or got decided because of it?" />
        <Text name="outcome" label="The outcome" area hint="What happened? Include numbers and how they were measured." />
        <Text name="caveats" label="Caveats" area hint="What would a skeptic point out? Other changes shipped at the same time, no control group, etc." />
      </fieldset>

      <fieldset>
        <legend>Evidence</legend>
        <div className="field">
          <span className="label">How strong is the evidence? *</span>
          <div className="radio-cards" role="radiogroup">
            {EVIDENCE.map((e) => (
              <label key={e.value} className="radio-card">
                <input type="radio" name="evidence_strength" value={e.value} required />
                <span>
                  <strong>{e.label}</strong>
                  <small>{e.description}</small>
                </span>
              </label>
            ))}
          </div>
          <Err msg={fe.evidence_strength} />
        </div>
        <div className="field">
          <span className="label">Public sources (optional)</span>
          <p className="hint">Blog posts, talks, papers. Not required, but they help it get approved.</p>
          {[1, 2, 3].map((i) => (
            <div className="row-2" key={i}>
              <input type="url" name={`source_url_${i}`} placeholder="https://…" aria-label={`Source ${i} URL`} />
              <input type="text" name={`source_title_${i}`} placeholder="Title" aria-label={`Source ${i} title`} />
            </div>
          ))}
          <Err msg={fe.sources} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Classification</legend>
        <div className="field">
          <span className="label">Methods</span>
          <div className="checks">
            {METHODS.map((m) => (
              <label key={m.value}>
                <input type="checkbox" name="methods" value={m.value} /> {m.label}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label">Metrics affected</span>
          <div className="checks">
            {METRICS.map((m) => (
              <label key={m.value}>
                <input type="checkbox" name="metrics" value={m.value} /> {m.label}
              </label>
            ))}
          </div>
        </div>
        <div className="row-2">
          <Select name="industry" label="Industry" options={INDUSTRIES} />
          <Select name="product_type" label="Product type" options={PRODUCT_TYPES} />
          <Select name="research_type" label="Research type" options={RESEARCH_TYPES} />
          <Select name="company_size" label="Company size" options={COMPANY_SIZES} />
        </div>
      </fieldset>

      <fieldset>
        <legend>About you (not published)</legend>
        <div className="row-2">
          <Text name="name" label="Your name" />
          <Text name="email" label="Email" type="email" required err={fe.email} hint="Only for follow-up questions." />
        </div>
        <Text
          name="verified_by"
          label="Verified by (published)"
          hint="Who can vouch for this? E.g. “Head of Research at the company” or a named person who agreed to be listed."
        />
        <label className="checks" style={{ fontSize: 14 }}>
          <input type="checkbox" name="consent" value="yes" required /> I&rsquo;m allowed to share this, and it
          doesn&rsquo;t include confidential information.
        </label>
        <Err msg={fe.consent} />
      </fieldset>

      <div className="hp" aria-hidden="true">
        <label>
          Website <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
