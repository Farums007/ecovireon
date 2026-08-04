-- Accepting an org invite auto-activates that org (0029's accept_org_invite)
-- when the person had no active org — but there was never a way back to a
-- personal/individual view afterward, even though organization_members
-- still remembers every org they belong to. Mirrors switch_active_organization:
-- same "primary + switch" model, just switching to no active org instead of
-- a different one. Membership rows are untouched, so switching back later
-- (switch_active_organization) still works exactly as before.
create or replace function public.switch_to_individual()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set organization_id = null, role = null, title = null, account_type = 'individual'
  where id = auth.uid();
end;
$$;
