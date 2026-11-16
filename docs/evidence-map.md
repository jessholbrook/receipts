# Evidence map prototype

The homepage adds a map of published receipts alongside the existing card view. The map helps a visitor see the range of contributions, then open a case and its sources. It does not estimate research ROI or compare effect sizes.

## Integration

- Map and Cards consume the same filtered results from `Explorer`. Search, all existing facets, result counts, empty-state recovery, and Lucky use the same pool.
- Cards are the default when no view is specified. `?view=cards` opens the cards; `?view=map` opens the map. The view is retained in result links and the existing back-to-results mechanism.
- Map uses the existing filter dialog at every width to recover the space occupied by the desktop sidebar. Cards retain the sidebar and sorting. The sort choice is preserved while the map is open.
- The homepage introduction keeps its copy but uses a smaller headline and less vertical space.
- Desktop: a full-width explorer contains the matrix and a sticky receipt preview. Small screens: contribution groups reflow into two evidence columns; selecting a dot reveals the summary above the map and brings it into view.
- Source summaries, evidence ratings, caveats, and the linked receipt pages come from existing published records. No database/schema changes or new analytics events.

## Editorial row assignments

`data/impact-groups.json` gives each slug one provisional primary home. These are proposed editorial assignments for Jess to review, not source-authored ratings or exclusive claims about the case. Multiple benefits are still visible in each receipt and its metric filters.

The starting pass used existing metric tags, then adjusted cases whose story warrants another home. For example, Michigan's benefits form is under access, the NYC summons is under risk, and GE's scanner experience is under making products work better. An assignment means the case addresses that contribution; it does not assert a measured effect, particularly for Decision cases.

- **Help a business grow:** commercial outcomes such as revenue, conversion, and retention.
- **Open up access:** inclusion, accessibility, and access to services.
- **Reduce mistakes & risk:** errors, harm, and avoiding investment in unsuitable features.
- **Make products work better:** usability, everyday use, and product decisions.

All 124 published slugs retrieved on 2026-11-16 have an assignment. A new/unrecognized slug appears under **Not yet grouped**, so adding a receipt never silently excludes it or guesses a classification. Update the JSON to place it; existing receipts need no migration.

Equal dots represent cases, not effect sizes. Position within a cell is packing only. Empty cells indicate collection coverage or filtering, not absence of research value. This selected public collection cannot estimate the prevalence or average impact of research.

## Local review

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3007
```

Open `http://127.0.0.1:3007/?view=map`. Data comes from the same public read-only published-entry query as the existing homepage. Local analytics remain disabled by the project's existing guard.

Review the map at full size, search Duolingo, filter to Tested, switch to Cards, open a receipt and return, then clear filters. Check that the same cases remain available in both views. Review row placements before merging.
