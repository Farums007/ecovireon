-- Unflag: clears a fraud flag and sends the tree back to normal pending
-- review, without deciding approve/reject for the admin. Mirrors the
-- existing approve_tree/reject_tree functions.
create or replace function public.unflag_tree(p_tree_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_is_platform_admin() then
    raise exception 'Only platform admins can unflag trees';
  end if;

  update public.trees
    set status = 'pending', rejection_reason = null
    where id = p_tree_id and status = 'flagged';

  if not found then
    raise exception 'Tree not found or not flagged';
  end if;
end;
$$;

-- Platform admin dashboard needs to see and moderate every org's
-- projects, not just their own — no such policy existed yet (projects
-- visibility was entirely org-scoped, plus the separate public-projects
-- policy).
create policy "Platform admins can view all projects" on public.projects
  for select
  using (public.current_is_platform_admin());

create policy "Platform admins can delete any project" on public.projects
  for delete
  using (public.current_is_platform_admin());

-- Needed to show each project's owning org name on the admin list.
create policy "Platform admins can view all organizations" on public.organizations
  for select
  using (public.current_is_platform_admin());
