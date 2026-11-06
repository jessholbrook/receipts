-- Slugs the monthly scout has already submitted (any status), so it doesn't resubmit.
-- Only exposes slugs of submissions from the scout's own address, never human submissions.
create or replace function public.scout_submitted_slugs()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select entry->>'slug' from public.submissions where submitter_email = 'scout@receipts.bot';
$$;

grant execute on function public.scout_submitted_slugs() to anon, authenticated;
