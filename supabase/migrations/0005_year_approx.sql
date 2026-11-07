-- Flag years that come from an undated source (shown as "c. 2021"), and load it in bulk upserts.
alter table public.entries add column if not exists year_approx boolean not null default false;

create or replace function public.admin_upsert_entries(token text, rows jsonb)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r jsonb;
  n int := 0;
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  for r in select * from jsonb_array_elements(rows) loop
    insert into public.entries (
      slug, title, company, is_anonymized, summary, problem, research, insight, change, outcome,
      headline_metric, attribution, caveats, methods, research_type, industry, product_type, metrics,
      company_size, year, year_approx, evidence_strength, source_type, sources
    ) values (
      r->>'slug', r->>'title', r->>'company', coalesce((r->>'is_anonymized')::boolean, false),
      r->>'summary', r->>'problem', r->>'research', r->>'insight', r->>'change', r->>'outcome',
      nullif(r->>'headline_metric',''), r->>'attribution', r->>'caveats',
      coalesce(array(select jsonb_array_elements_text(r->'methods')), '{}'),
      r->>'research_type', r->>'industry', r->>'product_type',
      coalesce(array(select jsonb_array_elements_text(r->'metrics')), '{}'),
      r->>'company_size', nullif(r->>'year','')::int, coalesce((r->>'year_approx')::boolean, false),
      r->>'evidence_strength', r->>'source_type',
      coalesce(r->'sources', '[]'::jsonb)
    )
    on conflict (slug) do update set
      title = excluded.title, company = excluded.company, is_anonymized = excluded.is_anonymized,
      summary = excluded.summary, problem = excluded.problem, research = excluded.research,
      insight = excluded.insight, change = excluded.change, outcome = excluded.outcome,
      headline_metric = excluded.headline_metric, attribution = excluded.attribution,
      caveats = excluded.caveats, methods = excluded.methods, research_type = excluded.research_type,
      industry = excluded.industry, product_type = excluded.product_type, metrics = excluded.metrics,
      company_size = excluded.company_size, year = excluded.year, year_approx = excluded.year_approx,
      evidence_strength = excluded.evidence_strength, source_type = excluded.source_type,
      sources = excluded.sources;
    n := n + 1;
  end loop;
  return n;
end;
$$;

