-- Platform admins need to see every profile (user management) and every
-- tree (moderation queue) regardless of org/ownership.

create policy "Platform admins can view all profiles"
  on public.profiles for select
  using (public.current_is_platform_admin());
