-- The `projects` SELECT policy checks `project_members` (for verifier access)
-- and the `project_members` policies check `projects` (for org scoping).
-- Postgres detects that cycle as infinite recursion. Route both lookups
-- through security definer helpers (same pattern as current_org_id/
-- current_role) so each side reads the other table without re-triggering
-- its RLS.

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = auth.uid()
  )
$$;

create or replace function public.project_organization_id(p_project_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.projects where id = p_project_id
$$;

drop policy "Org members can view projects per role" on public.projects;
create policy "Org members can view projects per role"
  on public.projects for select
  using (
    organization_id = public.current_org_id()
    and (
      public.current_role() in ('admin', 'field_staff')
      or public.is_project_member(id)
    )
  );

drop policy "Org members can view project membership" on public.project_members;
create policy "Org members can view project membership"
  on public.project_members for select
  using (public.project_organization_id(project_id) = public.current_org_id());

drop policy "Admins can manage project membership" on public.project_members;
create policy "Admins can manage project membership"
  on public.project_members for all
  using (
    public.project_organization_id(project_id) = public.current_org_id()
    and public.current_role() = 'admin'
  )
  with check (
    public.project_organization_id(project_id) = public.current_org_id()
    and public.current_role() = 'admin'
  );
