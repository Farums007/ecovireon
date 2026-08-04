-- Org-wide descriptive title (e.g. "Programme Manager", "GIS Analyst"),
-- shown alongside the functional role (admin/field_staff/verifier) on
-- the Teams page. Purely a display label — permissions still come from
-- profiles.role, unchanged.
alter table public.profiles add column title text;
