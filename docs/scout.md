# Monthly scout

A scheduled Claude task runs once a month, looks for newly published UX research wins,
and sends verified candidates to the **review queue** at `/admin`. It never publishes.

How it works:

1. A fresh cloud session starts with this repo.
2. It reads `BRIEF.md`, `docs/taxonomy.md` and `docs/entry-schema.md`.
3. It searches for cases published in roughly the last 2 months, opens each source, and writes
   5–10 candidates as JSON.
4. It runs `node scripts/scout-submit.mjs candidates.json`. The script validates against the taxonomy,
   skips anything already published or already submitted by the scout, and inserts the rest
   through the public insert-only API (same path as the website form).

Scout submissions show up in the queue from `scout@receipts.bot`, named
"Receipts monthly scout (automated)". Approve, edit or reject them like any other submission.

To pause or change the schedule, ask Claude to update the "Receipts monthly scout" scheduled task,
or manage it from your scheduled tasks list in Claude.
