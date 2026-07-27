-- current_is_platform_admin() returned SQL NULL (not false) whenever no
-- profile row matched auth.uid() (e.g. an unauthenticated/service context).
-- `if not <NULL>` is neither true nor false in PL/pgSQL, so `IF NOT
-- current_is_platform_admin() THEN raise exception` silently skipped the
-- guard instead of raising. Not reachable via the real app (authenticated
-- RPC calls always have a profile row, so this correctly returned true or
-- false), but exists() makes the function total or reachable via a
-- service-role/anon context, closing the gap.

create or replace function public.current_is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_platform_admin = true
  )
$$;
