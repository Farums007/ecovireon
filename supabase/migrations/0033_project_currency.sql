-- Budget had no currency attached — a project could show "20,000" with no
-- way to tell Naira from Rand from Euros from Dollars. Adds a currency
-- code alongside budget, defaulting to USD for existing rows.

alter table public.projects add column currency text not null default 'USD';
alter table public.projects add constraint projects_currency_check
  check (currency in ('USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'KES', 'GHS', 'INR', 'CAD', 'AUD'));

-- projects_geo (0027) — append-only: existing columns must keep their
-- exact position, currency goes at the very end.
create or replace view public.projects_geo as
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
  case
    when boundary is not null then ST_AsGeoJSON(boundary)::jsonb
    else null::jsonb
  end as boundary_geojson,
  is_public,
  restoration_type,
  country,
  region,
  funding_source,
  budget,
  expected_outcomes,
  public_sections,
  case
    when boundary is not null then ST_Area(boundary::geography) / 10000::double precision
    else null::double precision
  end as area_ha,
  currency
from public.projects;

-- create_project/update_project (0025) get p_currency appended. Per the
-- overload lesson learned earlier in this project: CREATE OR REPLACE
-- FUNCTION does NOT replace a function whose parameter list differs — it
-- silently adds another overload. Explicitly drop the old 15/16-arg
-- signatures first.
drop function if exists public.create_project(
  text, text, project_type, project_status, date, date, jsonb, jsonb, boolean,
  restoration_type, text, text, text, numeric, text
);
drop function if exists public.update_project(
  uuid, text, text, project_type, project_status, date, date, jsonb, jsonb, boolean,
  restoration_type, text, text, text, numeric, text
);

create function public.create_project(
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
  p_expected_outcomes text default null,
  p_currency text default 'USD'
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
    restoration_type, country, region, funding_source, budget, expected_outcomes, currency
  ) values (
    public.current_org_id(), p_name, p_description, p_project_type, p_status,
    p_start_date, p_end_date, coalesce(p_goals, '[]'::jsonb),
    case when p_boundary_geojson is not null
      then ST_SetSRID(ST_GeomFromGeoJSON(p_boundary_geojson::text), 4326)
      else null
    end,
    auth.uid(),
    coalesce(p_is_public, false),
    p_restoration_type, p_country, p_region, p_funding_source, p_budget, p_expected_outcomes,
    coalesce(p_currency, 'USD')
  )
  returning id into new_id;

  return new_id;
end;
$$;

create function public.update_project(
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
  p_expected_outcomes text default null,
  p_currency text default 'USD'
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
    expected_outcomes = p_expected_outcomes,
    currency = coalesce(p_currency, 'USD')
  where id = p_id;

  if not found then
    raise exception 'Project not found or not authorized';
  end if;
end;
$$;
