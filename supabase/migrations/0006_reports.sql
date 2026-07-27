-- Generated reports (CSV + PDF exports) and the report-exports storage bucket.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  observation_count integer not null default 0,
  csv_path text not null,
  pdf_path text not null,
  generated_by uuid not null references public.profiles (id),
  generated_at timestamptz not null default now()
);

create index reports_project_id_idx on public.reports (project_id);

alter table public.reports enable row level security;

-- Same visibility as the project itself: org admins/field staff, or
-- verifiers explicitly added via project_members.
create policy "Members can view reports for accessible projects"
  on public.reports for select
  using (public.can_access_project(project_id));

create policy "Admins can create reports for their org's projects"
  on public.reports for insert
  with check (public.can_access_project(project_id) and public.current_role() = 'admin');

create policy "Admins can delete reports for their org's projects"
  on public.reports for delete
  using (public.can_access_project(project_id) and public.current_role() = 'admin');

-- Storage: private bucket, org-scoped folder paths
-- (report-exports/{organization_id}/{project_id}/{filename}).
insert into storage.buckets (id, name, public)
values ('report-exports', 'report-exports', false)
on conflict (id) do nothing;

create policy "Org members can view their org's report exports"
  on storage.objects for select
  using (
    bucket_id = 'report-exports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "Admins can upload report exports"
  on storage.objects for insert
  with check (
    bucket_id = 'report-exports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() = 'admin'
  );

create policy "Admins can delete report exports"
  on storage.objects for delete
  using (
    bucket_id = 'report-exports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() = 'admin'
  );
