-- Monitoring sites, field observations, and the field-photos storage bucket.

create table public.monitoring_sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  location geometry(Point, 4326) not null,
  created_at timestamptz not null default now()
);

create index monitoring_sites_project_id_idx on public.monitoring_sites (project_id);
create index monitoring_sites_location_gix on public.monitoring_sites using gist (location);

create table public.field_observations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  site_id uuid references public.monitoring_sites (id) on delete set null,
  submitted_by uuid not null references public.profiles (id),
  observed_at timestamptz not null default now(),
  location geometry(Point, 4326),
  metrics jsonb not null default '{}'::jsonb,
  notes text not null default '',
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index field_observations_project_id_idx on public.field_observations (project_id);
create index field_observations_location_gix on public.field_observations using gist (location);

-- Shared visibility check reused by monitoring_sites and field_observations
-- policies: mirrors the `projects` select policy, but as a security definer
-- function so referencing it doesn't re-trigger RLS on `projects`.
create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and p.organization_id = public.current_org_id()
      and (
        public.current_role() in ('admin', 'field_staff')
        or public.is_project_member(p.id)
      )
  )
$$;

alter table public.monitoring_sites enable row level security;
alter table public.field_observations enable row level security;

create policy "Members can view monitoring sites for accessible projects"
  on public.monitoring_sites for select
  using (public.can_access_project(project_id));

create policy "Admins and field staff can manage monitoring sites"
  on public.monitoring_sites for all
  using (public.can_access_project(project_id) and public.current_role() in ('admin', 'field_staff'))
  with check (public.can_access_project(project_id) and public.current_role() in ('admin', 'field_staff'));

create policy "Members can view observations for accessible projects"
  on public.field_observations for select
  using (public.can_access_project(project_id));

create policy "Admins and field staff can create observations"
  on public.field_observations for insert
  with check (
    public.can_access_project(project_id)
    and public.current_role() in ('admin', 'field_staff')
    and submitted_by = auth.uid()
  );

create policy "Submitters and admins can update observations"
  on public.field_observations for update
  using (
    public.can_access_project(project_id)
    and (submitted_by = auth.uid() or public.current_role() = 'admin')
  )
  with check (
    public.can_access_project(project_id)
    and (submitted_by = auth.uid() or public.current_role() = 'admin')
  );

create policy "Submitters and admins can delete observations"
  on public.field_observations for delete
  using (
    public.can_access_project(project_id)
    and (submitted_by = auth.uid() or public.current_role() = 'admin')
  );

-- Read view (GeoJSON point) + write RPC (SRID-safe), same pattern as
-- projects_geo / create_project in 0003.
create view public.field_observations_geo
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
  case when location is not null then ST_AsGeoJSON(location)::jsonb end as location_geojson
from public.field_observations;

create or replace function public.create_field_observation(
  p_project_id uuid,
  p_observed_at timestamptz,
  p_lat double precision,
  p_lng double precision,
  p_metrics jsonb,
  p_notes text,
  p_photo_urls text[]
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.field_observations (
    project_id, submitted_by, observed_at, location, metrics, notes, photo_urls
  ) values (
    p_project_id,
    auth.uid(),
    coalesce(p_observed_at, now()),
    case when p_lat is not null and p_lng is not null
      then ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
      else null
    end,
    coalesce(p_metrics, '{}'::jsonb),
    coalesce(p_notes, ''),
    coalesce(p_photo_urls, '{}')
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Storage: field photos, private bucket, org-scoped folder paths
-- (field-photos/{organization_id}/{project_id}/{filename}).
insert into storage.buckets (id, name, public)
values ('field-photos', 'field-photos', false)
on conflict (id) do nothing;

create policy "Org members can view their org's field photos"
  on storage.objects for select
  using (
    bucket_id = 'field-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "Admins and field staff can upload field photos"
  on storage.objects for insert
  with check (
    bucket_id = 'field-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() in ('admin', 'field_staff')
  );

create policy "Admins and field staff can delete their org's field photos"
  on storage.objects for delete
  using (
    bucket_id = 'field-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() in ('admin', 'field_staff')
  );
