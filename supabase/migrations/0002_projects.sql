-- Projects, project team membership, and PostGIS site boundaries.

create extension if not exists postgis;

create type public.project_status as enum ('planning', 'active', 'monitoring', 'completed', 'archived');
create type public.project_type as enum ('restoration', 'conservation', 'urban_forestry', 'carbon');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text not null default '',
  status public.project_status not null default 'planning',
  project_type public.project_type not null,
  start_date date,
  end_date date,
  boundary geometry(Polygon, 4326),
  goals jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index projects_organization_id_idx on public.projects (organization_id);
create index projects_boundary_gix on public.projects using gist (boundary);

-- Grants access beyond the org-wide default, e.g. scoping an external
-- verifier to specific projects instead of the whole organization.
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- Admins and field staff see every project in their org; verifiers only
-- see projects they've been explicitly added to via project_members.
create policy "Org members can view projects per role"
  on public.projects for select
  using (
    organization_id = public.current_org_id()
    and (
      public.current_role() in ('admin', 'field_staff')
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = projects.id and pm.user_id = auth.uid()
      )
    )
  );

create policy "Admins can create projects"
  on public.projects for insert
  with check (organization_id = public.current_org_id() and public.current_role() = 'admin');

create policy "Admins can update projects in their organization"
  on public.projects for update
  using (organization_id = public.current_org_id() and public.current_role() = 'admin')
  with check (organization_id = public.current_org_id());

create policy "Admins can delete projects in their organization"
  on public.projects for delete
  using (organization_id = public.current_org_id() and public.current_role() = 'admin');

create policy "Org members can view project membership"
  on public.project_members for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id and p.organization_id = public.current_org_id()
    )
  );

create policy "Admins can manage project membership"
  on public.project_members for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id = public.current_org_id()
        and public.current_role() = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id = public.current_org_id()
        and public.current_role() = 'admin'
    )
  );
