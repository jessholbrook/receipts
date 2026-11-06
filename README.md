# Receipts

**What has UX research ever done for us?**

Live at **[researchreceipts.org](https://www.researchreceipts.org)** (also [whathasresearcheverdone.com](https://whathasresearcheverdone.com)).

A public atlas of documented cases where UX research improved a product, a business metric or a decision.
Every entry is rated for evidence strength (Tested, Measured, Reported, Decision) and source type.

- Project brief and principles: [`BRIEF.md`](BRIEF.md)
- Taxonomy: [`docs/taxonomy.md`](docs/taxonomy.md)
- Seed entry format: [`docs/entry-schema.md`](docs/entry-schema.md)

## Stack

- **Next.js 15** (App Router), deployed on Vercel.
- **Supabase Postgres** for entries and submissions. The browser and server only use the public
  publishable key; all access control lives in the database:
  - `entries`: anyone can read published rows. No public writes.
  - `submissions`: anyone can insert a pending row. Nobody can read through the API.
  - Moderation runs through `security definer` functions (`admin_*`) that check a bcrypt-hashed
    passphrase stored in `admin_secrets`.

Schema: [`supabase/migrations/`](supabase/migrations).

## Local development

```bash
npm install
npm run dev
```

The Supabase URL and publishable key have defaults in `lib/supabase.ts`. Override with
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Seed data

Seed entries live in `data/seed/*.json`. To validate and load them:

```bash
node scripts/build-seed.mjs          # validates against lib/taxonomy.ts, writes supabase/seed.json
RECEIPTS_ADMIN_TOKEN=... node scripts/load-seed.mjs   # upserts by slug
```

Card thumbnails come from each source page's own preview image (`og:image`). Generic images are
dropped automatically; veto specific ones in `data/thumbnail-blocklist.json`. To refresh:

```bash
RECEIPTS_ADMIN_TOKEN=... node scripts/fetch-thumbnails.mjs                  # all entries
RECEIPTS_ADMIN_TOKEN=... node scripts/fetch-thumbnails.mjs --only-missing   # just new ones
```

## Moderation

Go to `/admin` and sign in with the moderator passphrase. Pending submissions show up with an
editable JSON version of the entry: fix the slug, wording or ratings, then approve to publish,
or reject with a private note.

To change the passphrase, run in the Supabase SQL editor:

```sql
update admin_secrets set passphrase_hash = extensions.crypt('NEW-PASSPHRASE', extensions.gen_salt('bf', 10));
```

### About the Supabase security advisor warnings

The advisor flags the `admin_*` functions as "SECURITY DEFINER executable by anon". That's by design:
each one checks the moderator passphrase against a bcrypt hash before doing anything, and
`admin_check` sleeps 300ms per attempt to slow guessing. `admin_secrets` has RLS on with no
policies, so it's unreadable through the API.
