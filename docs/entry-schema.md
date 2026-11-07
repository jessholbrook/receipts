# Entry schema (seed JSON)

Each research batch file in `data/seed/` is a JSON array of objects shaped like this:

```json
{
  "slug": "gov-uk-carers-allowance",
  "title": "Short, specific headline naming the result",
  "company": "GOV.UK (Department for Work and Pensions)",
  "is_anonymized": false,
  "summary": "2–3 sentences in our own words: the situation, the research, the result.",
  "problem": "What was going wrong, or what question the team needed answered.",
  "research": "What the research was: who, how many, which methods, roughly when.",
  "insight": "What the research found that the team didn't already know.",
  "change": "What the team changed or decided because of the insight.",
  "outcome": "The result, with numbers if any. Say exactly what the source says.",
  "headline_metric": "+16% completion",
  "attribution": "How directly the source ties the outcome to the research. Be honest.",
  "caveats": "Anything a skeptic should know: no control group, vendor marketing, self-reported, old, etc.",
  "methods": ["usability_testing", "interviews"],
  "research_type": "evaluative",
  "industry": "government",
  "product_type": "public_service",
  "metrics": ["task_success", "support_cost"],
  "company_size": "public_sector",
  "year": 2014,
  "evidence_strength": "measured",
  "source_type": "first_party",
  "sources": [
    { "title": "Page title", "url": "https://...", "publisher": "GOV.UK blog", "date": "2014-05-01" }
  ]
}
```

Rules:
- All taxonomy fields must use slugs from `docs/taxonomy.md`.
- `headline_metric` is short (≤ 32 chars) and readable on its own: direction + number + what changed ("+36% landing-page conversion"). For `decision` entries it names the decision ("Killed the native app") and contains no numbers: a number there would contradict "no metric".
- Every entry needs at least one source URL that was actually opened and confirmed.
- Write in plain English, own words. No marketing tone. Short quotes only.
