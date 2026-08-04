-- 0024 redefined create_project/update_project starting from the 0003
-- baseline and forgot p_is_public, which 0008 had already added — that
-- silently dropped the parameter, breaking every project create/update
-- call (they're called with named args via supabase.rpc, so a missing
-- param name is a hard "function does not exist" error, not a no-op).
-- Restore it alongside the new fields from 0024.

create or replace function public.create_project(
  p_name text,
  p_description text,
  p_project_type public.project_type,
  p_status public.project_status,
  p_start_date date,
  p_end_date date,
  p_goals jsonb,
  p_boundary_geojson jsonb,
  p_is_public boolean default false,
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
    start_date, end_date, goals, boundary, created_by, is_public,
    restoration_type, country, region, funding_source, budget, expected_outcomes
  ) values (
    public.current_org_id(), p_name, p_description, p_project_type, p_status,
    p_start_date, p_end_date, coalesce(p_goals, '[]'::jsonb),
    case when p_boundary_geojson is not null
      then ST_SetSRID(ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)
      else null
    end,
    auth.uid(),
    coalesce(p_is_public, false),
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
  p_is_public boolean default false,
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
    is_public = coalesce(p_is_public, false),
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
