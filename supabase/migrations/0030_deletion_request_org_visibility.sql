-- 0029's "Requesters can view their own deletion requests" policy only let
-- the admin who submitted an org deletion request see that it's pending —
-- any other admin of the same org couldn't see the notice. Widen it so any
-- admin of the org can see a pending organization-type request, alongside
-- the existing "see my own" clause (which still covers individual-type
-- requests, always self-only).

drop policy "Requesters can view their own deletion requests" on public.deletion_requests;

create policy "Requesters and org admins can view deletion requests"
  on public.deletion_requests for select
  using (
    requested_by = auth.uid()
    or (
      type = 'organization'
      and organization_id = public.current_org_id()
      and public.current_role() = 'admin'
    )
  );
