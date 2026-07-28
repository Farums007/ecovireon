-- Lets the admin dashboard show each user's ban status. auth.users isn't
-- readable by normal clients, so expose just banned_until (nothing else)
-- through a security-definer function gated to platform admins — mirrors
-- find_user_id_by_email in 0017. The actual ban/unban/delete actions still
-- go through the Supabase Admin API with the service-role key server-side;
-- this function only covers the read side for the users table/list.

create or replace function public.list_user_ban_status()
returns table (id uuid, banned_until timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, u.banned_until
  from auth.users u
  where exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_platform_admin = true
  )
$$;

revoke all on function public.list_user_ban_status() from public, anon;
grant execute on function public.list_user_ban_status() to authenticated;
