-- Same class of gap as 0018: field_observations' update/delete policies
-- (and monitoring_sites' manage policy, unreachable today but built on
-- the same pattern) combined the now-broadened can_access_project with
-- raw current_role() = 'admin' — the caller's own org-wide role, not
-- necessarily tied to this project's org. Replace with an explicit
-- project-owning-org admin check, OR-ed with project-level admin (which
-- the field-observations INSERT policy already grants write access to).

drop policy "Submitters and admins can update observations" on public.field_observations;
create policy "Submitters and admins can update observations"
  on public.field_observations for update
  using (
    public.can_access_project(project_id)
    and (
      submitted_by = auth.uid()
      or (public.project_organization_id(project_id) = public.current_org_id() and public.current_role() = 'admin')
      or public.project_member_role(project_id) = 'admin'
    )
  )
  with check (
    public.can_access_project(project_id)
    and (
      submitted_by = auth.uid()
      or (public.project_organization_id(project_id) = public.current_org_id() and public.current_role() = 'admin')
      or public.project_member_role(project_id) = 'admin'
    )
  );

drop policy "Submitters and admins can delete observations" on public.field_observations;
create policy "Submitters and admins can delete observations"
  on public.field_observations for delete
  using (
    public.can_access_project(project_id)
    and (
      submitted_by = auth.uid()
      or (public.project_organization_id(project_id) = public.current_org_id() and public.current_role() = 'admin')
      or public.project_member_role(project_id) = 'admin'
    )
  );

drop policy "Admins and field staff can manage monitoring sites" on public.monitoring_sites;
create policy "Admins and field staff can manage monitoring sites"
  on public.monitoring_sites for all
  using (
    public.can_access_project(project_id)
    and (
      (public.project_organization_id(project_id) = public.current_org_id() and public.current_role() in ('admin', 'field_staff'))
      or public.project_member_role(project_id) in ('admin', 'field_staff')
    )
  )
  with check (
    public.can_access_project(project_id)
    and (
      (public.project_organization_id(project_id) = public.current_org_id() and public.current_role() in ('admin', 'field_staff'))
      or public.project_member_role(project_id) in ('admin', 'field_staff')
    )
  );
