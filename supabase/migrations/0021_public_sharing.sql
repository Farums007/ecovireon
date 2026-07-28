-- Public sharing: individual profile pages (trees, badges, count) and
-- org project transparency pages. Both are reachable only by someone who
-- has the link (no listing/search), matching how /trees/[id] already works.

-- profiles RLS is otherwise scoped to "your own org" or "yourself" — no
-- policy lets a stranger read someone else's row. Rather than widen RLS
-- (which would expose donations_total_kobo and every other column too),
-- expose just the safe fields through a security-definer function, same
-- pattern as find_user_id_by_email / list_user_ban_status.
create or replace function public.get_public_individual_profile(p_id uuid)
returns table (
  id uuid,
  full_name text,
  country text,
  trees_planted_count integer,
  co2_estimated_kg numeric,
  avatar_path text
)
language sql
security definer
stable
set search_path = public
as $$
  select id, full_name, country, trees_planted_count, co2_estimated_kg, avatar_path
  from public.profiles
  where id = p_id and account_type = 'individual'
$$;

grant execute on function public.get_public_individual_profile(uuid) to anon, authenticated;

-- Observations (metrics, notes, photos) for a project the org has opted
-- into public visibility (projects.is_public) — the same transparency
-- the org already extended by making the project public in the first
-- place. can_access_project() deliberately doesn't cover this case since
-- it gates *collaborator* access, which is a different, narrower thing.
create policy "Anyone can view observations for public projects" on public.field_observations
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = field_observations.project_id and p.is_public = true
    )
  );
