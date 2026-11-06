# Receipts — Project Brief

> **Receipts** — *What has UX research ever done for us?*

## Goal

A public, searchable atlas of documented cases where UX research improved a product,
a business metric, or a decision. Seeded from public sources, then grown through
community submissions that pass a review queue.

The point is to be **citable in a budget fight**. That means every entry is honest
about how strong its evidence is and how directly research caused the outcome.

## Principles

1. **Evidence over enthusiasm.** Every entry carries an evidence-strength rating.
   We never inflate it. A vague claim is labeled "Reported", not dressed up.
2. **Attribution matters.** Each entry states what the research found and what
   changed because of it. Without that link it's a redesign story, not a research win.
3. **Quant and qual both count.** Killing a bad feature before it's built is a win.
   It's labeled "Decision".
4. **Summarize, don't copy.** Entries are written in our own words with links to
   sources. Quotes are short and attributed.
5. **No fabrication.** Every seed entry has at least one working source URL.
   If we can't find the source, the entry doesn't go in.

## Evidence strength (categorical)

| Level | Meaning |
|---|---|
| `tested` | Controlled experiment or A/B test tied to the research-driven change |
| `measured` | Before/after metrics, no control group |
| `reported` | The company states an outcome but doesn't share the method |
| `decision` | Research changed a decision (killed, pivoted, re-prioritized), no metric |

## Source type

| Value | Meaning |
|---|---|
| `first_party` | The company's own blog, talk or report |
| `agency_vendor` | A consultancy, agency or tool vendor writing about its own client work (has an incentive) |
| `independent` | Journalism, academic paper, book, government audit, third-party analysis |
| `community` | Submitted to Receipts by a practitioner |

See [`docs/taxonomy.md`](docs/taxonomy.md) for every filter dimension and its allowed values.

## Scope (v1)

- Seed corpus: 50–100 well-sourced entries.
- Browse with filters: method, research type, industry, product type, metric,
  company size, year, evidence strength, source type. Full-text search.
- Entry detail pages with sources and caveats.
- Submission form: email + optional "verified by", anonymized entries allowed.
- Review queue: submissions stay private until a moderator approves them.
- Public deploy on Vercel. Data in Supabase.

## Decisions Claude can make without asking

- Stack, code structure, visual design, copy.
- Adding or removing taxonomy *values* (not dimensions) when the corpus needs them.
- Which cases go into the seed corpus, and their evidence ratings.
- Deploying to the public Vercel URL.

## Decisions that need Jess

- Buying a domain or anything else that costs money.
- New taxonomy dimensions or changes to the evidence scale.
- Publishing anything that names a private individual.
