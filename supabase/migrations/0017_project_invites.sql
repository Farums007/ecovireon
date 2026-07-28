-- Per-project collaborators: any platform account (individual or a
-- different org's staff) can be added to a specific project with a
-- project-scoped role (controls write access) and an optional free-text
-- title (display only). This is separate from org membership/org-wide
-- role — project_members.role only ever governs access to that one
-- project, never the owning organization's data.

alter table public.project_members
  add column role public.user_role not null default 'field_staff',
  add column title text;

-- Caller's own role on a project, regardless of org. Security definer so
-- it can be used inside RLS policies on other tables without recursion.
create or replace function public.project_member_role(p_project_id uuid)
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.project_members
  where project_id = p_project_id and user_id = auth.uid()
$$;

-- Looks up an existing account by email so an admin can add someone to a
-- project without duplicating a signup. Only returns a bare id (no PII),
-- and only callable by authenticated users, who must already pass the
-- project_members RLS check to do anything useful with the result.
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.find_user_id_by_email(text) from public, anon;
grant execute on function public.find_user_id_by_email(text) to authenticated, service_role;

-- Broaden project access: being a project_member is now sufficient on its
-- own (previously it only mattered for verifiers already inside the
-- owning org). Read access no longer requires org membership.
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
      and (
        (p.organization_id = public.current_org_id() and public.current_role() in ('admin', 'field_staff'))
        or public.is_project_member(p.id)
      )
  )
$$;

drop policy "Org members can view projects per role" on public.projects;
create policy "Org members can view projects per role"
  on public.projects for select
  using (
    (organization_id = public.current_org_id() and public.current_role() in ('admin', 'field_staff'))
    or public.is_project_member(id)
  );

-- Members need to see their own membership row even outside their org
-- (or with no org at all, for individuals) to show "your projects".
create policy "Members can view their own project membership"
  on public.project_members for select
  using (user_id = auth.uid());

-- Project-level admin/field_staff can also submit field data, alongside
-- the existing org-wide admin/field_staff check.
drop policy "Admins and field staff can create observations" on public.field_observations;
create policy "Admins and field staff can create observations"
  on public.field_observations for insert
  with check (
    public.can_access_project(project_id)
    and (
      public.current_role() in ('admin', 'field_staff')
      or public.project_member_role(project_id) in ('admin', 'field_staff')
    )
    and submitted_by = auth.uid()
  );

-- Field photos are stored at {owning org id}/{project id}/{filename}. The
-- old policy checked the uploader's own org against segment 1, which only
-- ever worked for native org members. Check project access instead, using
-- the project's actual org (segment 1) plus its id (segment 2).
drop policy "Org members can view their org's field photos" on storage.objects;
create policy "Project members can view their project's field photos" on storage.objects
  for select
  using (
    bucket_id = 'field-photos'
    and public.can_access_project(((storage.foldername(name))[2])::uuid)
  );

drop policy "Admins and field staff can upload field photos" on storage.objects;
create policy "Project members can upload field photos" on storage.objects
  for insert
  with check (
    bucket_id = 'field-photos'
    and public.can_access_project(((storage.foldername(name))[2])::uuid)
    and (
      public.current_role() in ('admin', 'field_staff')
      or public.project_member_role(((storage.foldername(name))[2])::uuid) in ('admin', 'field_staff')
    )
  );

drop policy "Admins and field staff can delete their org's field photos" on storage.objects;
create policy "Project members can delete their project's field photos" on storage.objects
  for delete
  using (
    bucket_id = 'field-photos'
    and public.can_access_project(((storage.foldername(name))[2])::uuid)
    and (
      public.current_role() in ('admin', 'field_staff')
      or public.project_member_role(((storage.foldername(name))[2])::uuid) in ('admin', 'field_staff')
    )
  );
