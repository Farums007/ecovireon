-- Per-project area (hectares), computed once here instead of a separate
-- RPC call everywhere a single project's area is needed (Impact tab,
-- project cards, etc.) — org_restoration_area_ha (0024) stays for the
-- org-wide dashboard KPI, this is the per-row equivalent.
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
  public_sections,
  case when boundary is not null then ST_Area(boundary::geography) / 10000 end as area_ha
from public.projects;
