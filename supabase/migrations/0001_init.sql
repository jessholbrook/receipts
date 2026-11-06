-- Receipts: initial schema
-- entries: published cases (public read)
-- submissions: community submissions (public insert only, private until reviewed)
-- admin access goes through security-definer RPCs that check a hashed passphrase

create extension if not exists pgcrypto with schema extensions;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 5 and 200),
  company text not null,
  is_anonymized boolean not null default false,
  summary text not null,
  problem text,
  research text,
  insight text,
  change text,
  outcome text,
  headline_metric text,
  attribution text,
  caveats text,
  methods text[] not null default '{}',
  research_type text,
  industry text,
  product_type text,
  metrics text[] not null default '{}',
  company_size text,
  year int check (year between 1950 and 2100),
  evidence_strength text not null check (evidence_strength in ('tested','measured','reported','decision')),
  source_type text not null check (source_type in ('first_party','agency_vendor','independent','community')),
  sources jsonb not null default '[]'::jsonb,
  verified_by text,
  submission_id uuid,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary,'') || ' ' || coalesce(headline_metric,'')), 'B') ||
    setweight(to_tsvector('english',
      coalesce(problem,'') || ' ' || coalesce(research,'') || ' ' || coalesce(insight,'') || ' ' ||
      coalesce(change,'') || ' ' || coalesce(outcome,'')), 'C')
  ) stored
);

create index entries_search_idx on public.entries using gin (search);
create index entries_published_idx on public.entries (published, created_at desc);

alter table public.entries enable row level security;

create policy "Published entries are public"
  on public.entries for select
  to anon, authenticated
  using (published = true);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitter_name text check (char_length(submitter_name) <= 200),
  submitter_email text not null check (submitter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(submitter_email) <= 320),
  verified_by text check (char_length(verified_by) <= 500),
  entry jsonb not null check (pg_column_size(entry) < 50000),
  moderator_note text,
  reviewed_at timestamptz
);

alter table public.submissions enable row level security;

-- Anyone can submit; nobody can read submissions through the public API.
create policy "Anyone can submit"
  on public.submissions for insert
  to anon, authenticated
  with check (status = 'pending' and moderator_note is null and reviewed_at is null);

create table public.admin_secrets (
  id int primary key default 1 check (id = 1),
  passphrase_hash text not null
);
alter table public.admin_secrets enable row level security;
-- no policies: inaccessible via the API

create or replace function public._admin_ok(token text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.admin_secrets
    where passphrase_hash = extensions.crypt(token, passphrase_hash)
  );
$$;
revoke all on function public._admin_ok(text) from public, anon, authenticated;

create or replace function public.admin_check(token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform pg_sleep(0.3); -- slow down guessing
  return public._admin_ok(token);
end;
$$;

create or replace function public.admin_list_submissions(token text, which text default 'pending')
returns setof public.submissions
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select * from public.submissions s
    where which = 'all' or s.status = which
    order by s.created_at desc;
end;
$$;

create or replace function public.admin_approve_submission(token text, submission uuid, final_entry jsonb)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_slug text;
  s public.submissions;
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select * into s from public.submissions where id = submission for update;
  if not found then raise exception 'submission not found'; end if;

  insert into public.entries (
    slug, title, company, is_anonymized, summary, problem, research, insight, change, outcome,
    headline_metric, attribution, caveats, methods, research_type, industry, product_type, metrics,
    company_size, year, evidence_strength, source_type, sources, verified_by, submission_id
  ) values (
    final_entry->>'slug', final_entry->>'title', final_entry->>'company',
    coalesce((final_entry->>'is_anonymized')::boolean, false),
    final_entry->>'summary', final_entry->>'problem', final_entry->>'research', final_entry->>'insight',
    final_entry->>'change', final_entry->>'outcome', nullif(final_entry->>'headline_metric',''),
    final_entry->>'attribution', final_entry->>'caveats',
    coalesce(array(select jsonb_array_elements_text(final_entry->'methods')), '{}'),
    final_entry->>'research_type', final_entry->>'industry', final_entry->>'product_type',
    coalesce(array(select jsonb_array_elements_text(final_entry->'metrics')), '{}'),
    final_entry->>'company_size', nullif(final_entry->>'year','')::int,
    final_entry->>'evidence_strength', coalesce(final_entry->>'source_type','community'),
    coalesce(final_entry->'sources','[]'::jsonb), s.verified_by, s.id
  ) returning slug into new_slug;

  update public.submissions
    set status = 'approved', reviewed_at = now(), entry = final_entry
    where id = submission;
  return new_slug;
end;
$$;

create or replace function public.admin_reject_submission(token text, submission uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.submissions
    set status = 'rejected', reviewed_at = now(), moderator_note = note
    where id = submission;
end;
$$;

create or replace function public.admin_unpublish_entry(token text, entry_slug text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.entries set published = false where slug = entry_slug;
end;
$$;

grant execute on function public.admin_check(text) to anon, authenticated;
grant execute on function public.admin_list_submissions(text, text) to anon, authenticated;
grant execute on function public.admin_approve_submission(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.admin_reject_submission(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_unpublish_entry(text, text) to anon, authenticated;
