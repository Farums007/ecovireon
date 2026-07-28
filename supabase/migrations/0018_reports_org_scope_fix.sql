-- 0017 broadened can_access_project to cover any project_member,
-- regardless of org. reports' insert/delete policies combined
-- can_access_project with current_role() = 'admin' — the caller's own
-- org-wide admin flag, not tied to the project's org at all. That
-- combination now lets an admin from a *different* org generate/delete
-- reports on a project they were only added to as e.g. a verifier.
-- Report generation stays a native-org-admin-only action (it isn't part
-- of what project collaborators are granted), so scope it back to an
-- explicit org match instead of the general access check.

drop policy "Admins can create reports for their org's projects" on public.reports;
create policy "Admins can create reports for their org's projects"
  on public.reports for insert
  with check (
    public.project_organization_id(project_id) = public.current_org_id()
    and public.current_role() = 'admin'
  );

drop policy "Admins can delete reports for their org's projects" on public.reports;
create policy "Admins can delete reports for their org's projects"
  on public.reports for delete
  using (
    public.project_organization_id(project_id) = public.current_org_id()
    and public.current_role() = 'admin'
  );
