-- Organization Dashboard v2: restoration types, project funding/location
-- fields, observation verification workflow, and public-share section
-- toggles. Additive only — existing rows/queries keep working.

create type public.restoration_type as enum (
  'forest', 'mangrove', 'wetland', 'grassland', 'coral', 'agroforestry', 'biodiversity', 'other'
);

alter table public.projects
  add column restoration_type public.restoration_type not null default 'other',
  add column country text,
  add column region text,
  add column funding_source text,
  add column budget numeric,
  add column expected_outcomes text,
  add column public_sections jsonb not null default
    '{"overview":true,"map":true,"photos":true,"monitoring":true,"impact":true,"partners":true}'::jsonb;

-- Verification workflow on field observations. The existing "Submitters
-- and admins can update observations" policy (0019) already covers who
-- may write to these new columns (submitter, or org/project admin) at
-- the RLS layer — same as every other observation field. Restricting
-- verification specifically to admins (not the submitter reviewing
-- their own work) is enforced in the server action, matching the
-- app-level-check-on-top-of-broader-RLS pattern already used elsewhere
-- (generateReport, deleteProject, etc.), not a new RLS policy.
create type public.verification_status as enum ('pending', 'verified', 'needs_review', 'rejected');

alter table public.field_observations
  add column verification_status public.verification_status not null default 'pending',
  add column reviewed_by uuid references public.profiles (id),
  add column reviewed_at timestamptz,
  add column review_comment text;

-- projects_geo (0003) lists explicit columns rather than select * —
-- recreate it to expose the new fields. CREATE OR REPLACE VIEW requires
-- existing columns to keep their original position, so new columns are
-- appended at the end rather than grouped near related existing ones.
create or replace view public.projects_geo
with (security_invoker = on) as
select
  id,
  organization_id,
  name,
  description,
  status,
  project_type,
  start_date,
  end_date,
  goals,
  created_by,
  created_at,
  case when boundary is not null then ST_AsGeoJSON(boundary)::jsonb end as boundary_geojson,
  is_public,
  restoration_type,
  country,
  region,
  funding_source,
  budget,
  expected_outcomes,
  public_sections
from public.projects;

-- field_observations_geo (0005) — same append-only constraint.
create or replace view public.field_observations_geo
with (security_invoker = on) as
select
  id,
  project_id,
  site_id,
  submitted_by,
  observed_at,
  metrics,
  notes,
  photo_urls,
  created_at,
  case when location is not null then ST_AsGeoJSON(location)::jsonb end as location_geojson,
  verification_status,
  reviewed_by,
  reviewed_at,
  review_comment
from public.field_observations;

-- Org settings (name edit) — no admin UPDATE policy existed on
-- organizations at all before this.
create policy "Admins can update their own organization" on public.organizations
  for update
  using (id = public.current_org_id() and public.current_role() = 'admin')
  with check (id = public.current_org_id() and public.current_role() = 'admin');

-- create_project/update_project (0003) gain the new fields as trailing
-- defaulted params — existing callers passing only the original
-- arguments keep working unchanged.
create or replace function public.create_project(
  p_name text,
  p_description text,
  p_project_type public.project_type,
  p_status public.project_status,
  p_start_date date,
  p_end_date date,
  p_goals jsonb,
  p_boundary_geojson jsonb,
  p_restoration_type public.restoration_type default 'other',
  p_country text default null,
  p_region text default null,
  p_funding_source text default null,
  p_budget numeric default null,
  p_expected_outcomes text default null
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.projects (
    organization_id, name, description, project_type, status,
    start_date, end_date, goals, boundary, created_by,
    restoration_type, country, region, funding_source, budget, expected_outcomes
  ) values (
    public.current_org_id(), p_name, p_description, p_project_type, p_status,
    p_start_date, p_end_date, coalesce(p_goals, '[]'::jsonb),
    case when p_boundary_geojson is not null
      then ST_SetSRID(ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)
      else null
    end,
    auth.uid(),
    p_restoration_type, p_country, p_region, p_funding_source, p_budget, p_expected_outcomes
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.update_project(
  p_id uuid,
  p_name text,
  p_description text,
  p_project_type public.project_type,
  p_status public.project_status,
  p_start_date date,
  p_end_date date,
  p_goals jsonb,
  p_boundary_geojson jsonb,
  p_restoration_type public.restoration_type default 'other',
  p_country text default null,
  p_region text default null,
  p_funding_source text default null,
  p_budget numeric default null,
  p_expected_outcomes text default null
) returns void
language plpgsql
set search_path = public
as $$
begin
  update public.projects set
    name = p_name,
    description = p_description,
    project_type = p_project_type,
    status = p_status,
    start_date = p_start_date,
    end_date = p_end_date,
    goals = coalesce(p_goals, '[]'::jsonb),
    boundary = case when p_boundary_geojson is not null
      then ST_SetSRID(ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)
      else boundary
    end,
    restoration_type = p_restoration_type,
    country = p_country,
    region = p_region,
    funding_source = p_funding_source,
    budget = p_budget,
    expected_outcomes = p_expected_outcomes
  where id = p_id;

  if not found then
    raise exception 'Project not found or not authorized';
  end if;
end;
$$;

-- Area Under Restoration KPI — relies on the caller's own RLS to see
-- their org's projects, same trust boundary as any other org query.
create or replace function public.org_restoration_area_ha(p_organization_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(sum(ST_Area(boundary::geography) / 10000), 0)
  from public.projects
  where organization_id = p_organization_id and boundary is not null
$$;
