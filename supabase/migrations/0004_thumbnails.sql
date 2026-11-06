-- Card thumbnails: the source page's own preview image (og:image), when it's specific to the case.
alter table public.entries add column if not exists image_url text
  check (image_url is null or image_url ~ '^https://');

-- Admin-only bulk setter used by scripts/fetch-thumbnails.mjs. images = {"slug": "https://..." | null}
create or replace function public.admin_set_images(token text, images jsonb)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  k text;
  v jsonb;
  n int := 0;
begin
  if not public._admin_ok(token) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  for k, v in select * from jsonb_each(images) loop
    update public.entries set image_url = nullif(v #>> '{}', '') where slug = k;
    if found then n := n + 1; end if;
  end loop;
  return n;
end;
$$;

grant execute on function public.admin_set_images(text, jsonb) to anon, authenticated;
