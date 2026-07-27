-- The public tree map/detail page needs to show who planted a tree, but
-- profiles RLS otherwise only allows org-scoped or self access. Scope
-- public visibility narrowly: only profiles that own at least one approved
-- tree become visible (their name becomes a public, creditable badge —
-- consistent with the platform's public leaderboard/badge design), and only
-- full_name is ever selected for public display in application code.

create policy "Verified tree owners are publicly visible"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trees t
      where t.owner_id = profiles.id and t.status = 'approved'
    )
  );

create or replace view public.trees_geo
with (security_invoker = on) as
select
  t.id,
  t.planted_by,
  t.owner_id,
  t.organization_id,
  t.species,
  t.height_note,
  t.location_label,
  t.soil_type,
  t.notes,
  t.photo_path,
  t.gps_accuracy_m,
  t.observed_at,
  t.status,
  t.rejection_reason,
  t.co2_estimate_kg,
  t.reviewed_by,
  t.reviewed_at,
  t.created_at,
  ST_AsGeoJSON(t.location)::jsonb as location_geojson,
  p.full_name as owner_name
from public.trees t
left join public.profiles p on p.id = t.owner_id;
