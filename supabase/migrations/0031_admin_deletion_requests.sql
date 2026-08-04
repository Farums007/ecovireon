-- deletion_requests (0029) had no admin-facing visibility at all: the only
-- SELECT policy scoped rows to the requester themselves (or, for org-type
-- requests, admins of that specific org) — a platform admin had no way to
-- see requests across the whole platform, let alone act on one. Adds that,
-- plus the columns needed to record who handled a request and when.

alter table public.deletion_requests
  add column resolved_by uuid references public.profiles (id),
  add column resolved_at timestamptz;

create policy "Platform admins can view all deletion requests"
  on public.deletion_requests for select
  using (public.current_is_platform_admin());

create policy "Platform admins can update deletion requests"
  on public.deletion_requests for update
  using (public.current_is_platform_admin())
  with check (public.current_is_platform_admin());
