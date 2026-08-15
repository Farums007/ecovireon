-- projects_geo lost its `security_invoker = on` option in 0033
-- (CREATE OR REPLACE VIEW does not carry reloptions forward — every
-- earlier redefinition in 0008/0024/0027 re-specified it, 0033 didn't).
-- Without it the view runs as its owner and bypasses RLS on the
-- underlying `projects` table entirely, so getProject(id) let any caller
-- read any org's private project by id. Restoring the option is a no-op
-- for every other column — this recreates the exact 0033 column list,
-- just with the safety clause put back.
--
-- The Security Advisor's other flag, RLS Disabled in Public on
-- spatial_ref_sys, is left alone: that table ships with the postgis
-- extension (0002), is owned by the role that installed the extension
-- (not `postgres`), and ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- requires ownership — confirmed failing with `must be owner of table
-- spatial_ref_sys` even from the Supabase SQL Editor. It only holds
-- public SRID reference data, no app data, so this is a known/accepted
-- false positive rather than a real exposure.

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
