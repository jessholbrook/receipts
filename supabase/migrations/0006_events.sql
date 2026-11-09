-- Anonymous product events: which actions people take (copy a citation, open a source, filter...).
-- No user ids, no IPs, no cookies. Anyone can insert a known event; nobody can read through the API.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (name in (
    'copy_citation', 'copy_link', 'copy_results_link', 'source_click', 'lucky',
    'filter', 'search', 'sheet_open', 'show_all', 'submit_success', 'share_landing'
  )),
  path text check (char_length(path) <= 300),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 1000)
);

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_name_idx on public.events (name, created_at desc);

alter table public.events enable row level security;

create policy "Anyone can record an event"
  on public.events for insert
  to anon, authenticated
  with check (true);

-- Moderator summary: counts per event, and the top values of its main property, for the last N days.
create or replace function public.admin_event_summary(token text, days int default 30)
returns table (name text, events bigint, detail jsonb)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  with recent as (
    select e.name, e.props from public.events e
    where e.created_at > now() - make_interval(days => greatest(1, least(days, 365)))
  ),
  keyed as (
    select r.name,
      coalesce(r.props->>'slug', r.props->>'value', r.props->>'q', r.props->>'facet', '') as k
    from recent r
  ),
  tops as (
    select kk.name, jsonb_agg(jsonb_build_object('key', kk.k, 'n', kk.n) order by kk.n desc) as top
    from (
      select keyed.name, keyed.k, count(*) as n,
        row_number() over (partition by keyed.name order by count(*) desc) as rn
      from keyed where keyed.k <> ''
      group by keyed.name, keyed.k
    ) kk
    where kk.rn <= 5
    group by kk.name
  )
  select r.name, count(*)::bigint, coalesce(t.top, '[]'::jsonb)
  from recent r left join tops t on t.name = r.name
  group by r.name, t.top
  order by count(*) desc;
end;
$$;

grant execute on function public.admin_event_summary(text, int) to anon, authenticated;
