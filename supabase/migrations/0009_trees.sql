-- Citizen tree log: one row per physical tree, owned by a person, publicly
-- viewable once verified. Separate from field_observations (org/project
-- M&E data) — see migration comments in 0005 for that distinction.

create type public.tree_status as enum ('pending', 'approved', 'rejected', 'flagged');

create table public.trees (
  id uuid primary key default gen_random_uuid(),
  planted_by uuid not null references public.profiles (id),
  owner_id uuid not null references public.profiles (id),
  organization_id uuid references public.organizations (id),
  species text not null,
  height_note text,
  location_label text,
  soil_type text,
  notes text,
  photo_path text not null,
  location geometry(Point, 4326) not null,
  gps_accuracy_m double precision,
  observed_at timestamptz not null default now(),
  status public.tree_status not null default 'pending',
  rejection_reason text,
  co2_estimate_kg numeric not null default 0,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index trees_owner_id_idx on public.trees (owner_id);
create index trees_status_idx on public.trees (status);
create index trees_location_gix on public.trees using gist (location);

create or replace function public.current_is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(is_platform_admin, false) from public.profiles where id = auth.uid()
$$;

alter table public.trees enable row level security;

create policy "Anyone can view approved trees"
  on public.trees for select
  using (status = 'approved');

create policy "Owners and planters can view their own trees"
  on public.trees for select
  using (owner_id = auth.uid() or planted_by = auth.uid());

create policy "Platform admins can view all trees"
  on public.trees for select
  using (public.current_is_platform_admin());

create policy "Users can log their own trees"
  on public.trees for insert
  with check (planted_by = auth.uid() and owner_id = auth.uid());

create policy "Platform admins can update tree status"
  on public.trees for update
  using (public.current_is_platform_admin())
  with check (public.current_is_platform_admin());

-- Inserts as 'pending', or 'flagged' if >5 trees were logged within 5m in
-- the last 24h (duplicate-coordinate fraud signal). Not security definer —
-- RLS ("Users can log their own trees") is the real boundary.
create or replace function public.create_tree(
  p_species text,
  p_height_note text,
  p_location_label text,
  p_soil_type text,
  p_notes text,
  p_photo_path text,
  p_lat double precision,
  p_lng double precision,
  p_gps_accuracy_m double precision,
  p_observed_at timestamptz
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_id uuid;
  nearby_count integer;
  initial_status public.tree_status := 'pending';
  point geometry := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
begin
  select count(*) into nearby_count
  from public.trees
  where created_at > now() - interval '24 hours'
    and ST_DWithin(location::geography, point::geography, 5);

  if nearby_count >= 5 then
    initial_status := 'flagged';
  end if;

  insert into public.trees (
    planted_by, owner_id, species, height_note, location_label, soil_type,
    notes, photo_path, location, gps_accuracy_m, observed_at, status
  ) values (
    auth.uid(), auth.uid(), p_species, p_height_note, p_location_label, p_soil_type,
    p_notes, p_photo_path, point, p_gps_accuracy_m, coalesce(p_observed_at, now()), initial_status
  )
  returning id into new_id;

  return new_id;
end;
$$;

create view public.trees_geo
with (security_invoker = on) as
select
  id,
  planted_by,
  owner_id,
  organization_id,
  species,
  height_note,
  location_label,
  soil_type,
  notes,
  photo_path,
  gps_accuracy_m,
  observed_at,
  status,
  rejection_reason,
  co2_estimate_kg,
  reviewed_by,
  reviewed_at,
  created_at,
  ST_AsGeoJSON(location)::jsonb as location_geojson
from public.trees;

-- Public bucket: a map with many pins needs cheap, direct image URLs, and
-- only approved trees are ever linked to from public UI.
insert into storage.buckets (id, name, public)
values ('tree-photos', 'tree-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view tree photos"
  on storage.objects for select
  using (bucket_id = 'tree-photos');

create policy "Authenticated users can upload tree photos"
  on storage.objects for insert
  with check (bucket_id = 'tree-photos' and auth.uid() is not null);
