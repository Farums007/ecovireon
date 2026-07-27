-- GeoJSON-friendly read view and write RPCs for projects.
-- PostgREST returns raw `geometry` columns as WKB hex, so reads go through
-- a view that casts to GeoJSON. Writes go through RPCs so the boundary can
-- be tagged with SRID 4326 (PostGIS's flexible geometry input parser
-- accepts GeoJSON text, but doesn't stamp an SRID from it, and this
-- column's typmod requires one).
--
-- Both the view and the RPCs run with the caller's own privileges
-- (no `security definer`), so the existing RLS policies on `projects`
-- still apply.

create view public.projects_geo
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
  case when boundary is not null then ST_AsGeoJSON(boundary)::jsonb end as boundary_geojson
from public.projects;

create or replace function public.create_project(
  p_name text,
  p_description text,
  p_project_type public.project_type,
  p_status public.project_status,
  p_start_date date,
  p_end_date date,
  p_goals jsonb,
  p_boundary_geojson jsonb
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.projects (
    organization_id, name, description, project_type, status,
    start_date, end_date, goals, boundary, created_by
  ) values (
    public.current_org_id(), p_name, p_description, p_project_type, p_status,
    p_start_date, p_end_date, coalesce(p_goals, '[]'::jsonb),
    case when p_boundary_geojson is not null
      then ST_SetSRID(ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)
      else null
    end,
    auth.uid()
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
  p_boundary_geojson jsonb
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
    end
  where id = p_id;

  if not found then
    raise exception 'Project not found or not authorized';
  end if;
end;
$$;
