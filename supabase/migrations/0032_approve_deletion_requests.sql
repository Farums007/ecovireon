-- Wires up real deletion behind "Approve" on /admin/deletion-requests.
-- Historical impact/financial data (trees, donations, observations,
-- reports) is preserved and anonymized rather than deleted — only the
-- attribution to the removed person/org goes away.

-- These "who did this" columns are NOT NULL with ON DELETE NO ACTION back
-- to profiles today, which is exactly why the existing /admin/users delete
-- button already fails outright on any account with linked data. Loosen
-- them so they can be nulled instead of blocking the delete.
alter table public.trees alter column owner_id drop not null;
alter table public.trees alter column planted_by drop not null;
alter table public.field_observations alter column submitted_by drop not null;
alter table public.reports alter column generated_by drop not null;
alter table public.tree_checkins alter column submitted_by drop not null;
alter table public.projects alter column created_by drop not null;
alter table public.deletion_requests alter column requested_by drop not null;

-- deletion_requests.organization_id/user_id are currently ON DELETE
-- CASCADE, meaning the moment a request is actually acted on, the "completed"
-- row would delete *itself* along with its target — the Completed tab
-- would always read empty. Switch to SET NULL, and add a denormalized name
-- snapshot (captured at resolution time) so the row still reads sensibly
-- once its target is gone.
alter table public.deletion_requests
  drop constraint deletion_requests_organization_id_fkey,
  add constraint deletion_requests_organization_id_fkey
    foreign key (organization_id) references public.organizations (id) on delete set null;

alter table public.deletion_requests
  drop constraint deletion_requests_user_id_fkey,
  add constraint deletion_requests_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete set null;

alter table public.deletion_requests add column target_name text;

-- deletion_requests_target_shape (0029) required organization_id/user_id to
-- always be non-null for the matching type. That's wrong now: the new ON
-- DELETE SET NULL above fires the moment the target is actually deleted,
-- regardless of whether the row's status has been flipped to 'completed'
-- yet — and during actual testing, the real ordering (prepare_individual_
-- deletion, then the Admin API deletes auth.users, *then* the app marks
-- the row completed) means the cascade always lands while status is still
-- 'pending'. Trying to special-case "or status <> 'pending'" doesn't fix
-- this, since deleteUser's cascade happens strictly before that update
-- runs. Drop the non-null requirement entirely — the only thing worth
-- enforcing here is that a row's id matches its declared type (never both,
-- never the wrong one), which RLS already guarantees is set correctly at
-- insert time regardless of what happens to it later.
alter table public.deletion_requests drop constraint deletion_requests_target_shape;
alter table public.deletion_requests add constraint deletion_requests_target_shape check (
  (type = 'organization' and user_id is null)
  or (type = 'individual' and organization_id is null)
);

-- Approves an organization-type request: converts every member to a plain
-- individual account (same shape as remove_org_member — they keep their
-- login, just lose org access), anonymizes trees/donations that reference
-- this org or its projects, records the resolution, then deletes the org.
-- Everything else (org_invites, projects -> monitoring_sites/
-- field_observations/project_members/reports, organization_members) is
-- already ON DELETE CASCADE off organizations and follows automatically.
create or replace function public.approve_organization_deletion_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  org_name text;
begin
  if not public.current_is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select * into req from public.deletion_requests
    where id = p_request_id and type = 'organization' and status = 'pending';
  if req.id is null then
    raise exception 'Request not found or not pending';
  end if;

  select name into org_name from public.organizations where id = req.organization_id;
  if org_name is null then
    raise exception 'Organization no longer exists';
  end if;

  update public.profiles
  set organization_id = null, role = null, title = null, account_type = 'individual'
  where organization_id = req.organization_id;

  update public.trees set organization_id = null where organization_id = req.organization_id;
  update public.donations set organization_id = null where organization_id = req.organization_id;
  update public.donations set project_id = null
    where project_id in (select id from public.projects where organization_id = req.organization_id);

  update public.deletion_requests
  set status = 'completed', resolved_by = auth.uid(), resolved_at = now(), target_name = org_name
  where id = p_request_id;

  delete from public.organizations where id = req.organization_id;
end;
$$;

-- Anonymizes an individual's attribution across every table that would
-- otherwise block deleting their auth.users row, and guards against
-- deleting someone who's the sole admin of an org they belong to. Does
-- NOT touch auth.users or the request's status — the actual login removal
-- has to go through the Supabase Admin API (service-role client) from the
-- app layer, same as the existing deleteUser action in
-- src/app/(admin)/admin/users/actions.ts. Splitting it this way means a
-- failed Admin API call afterward leaves nothing inconsistent — the
-- request just stays pending and can be retried.
create or replace function public.prepare_individual_deletion(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  sole_admin_org uuid;
  other_admin_count int;
begin
  if not public.current_is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select * into req from public.deletion_requests
    where id = p_request_id and type = 'individual' and status = 'pending';
  if req.id is null then
    raise exception 'Request not found or not pending';
  end if;

  for sole_admin_org in
    select organization_id from public.organization_members
    where user_id = req.user_id and role = 'admin'
  loop
    select count(*) into other_admin_count
    from public.organization_members
    where organization_id = sole_admin_org and role = 'admin' and user_id <> req.user_id;
    if other_admin_count = 0 then
      raise exception 'This person is the only admin of an organization — remove or reassign them there first';
    end if;
  end loop;

  update public.trees set owner_id = null where owner_id = req.user_id;
  update public.trees set planted_by = null where planted_by = req.user_id;
  update public.trees set reviewed_by = null where reviewed_by = req.user_id;
  update public.field_observations set submitted_by = null where submitted_by = req.user_id;
  update public.field_observations set reviewed_by = null where reviewed_by = req.user_id;
  update public.reports set generated_by = null where generated_by = req.user_id;
  update public.tree_checkins set submitted_by = null where submitted_by = req.user_id;
  update public.donations set donor_id = null where donor_id = req.user_id;
  update public.projects set created_by = null where created_by = req.user_id;
  update public.deletion_requests set requested_by = null where requested_by = req.user_id;
  update public.deletion_requests set resolved_by = null where resolved_by = req.user_id;

  return req.user_id;
end;
$$;
