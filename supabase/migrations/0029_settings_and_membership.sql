-- Org Settings iteration (profile fields, logo, data management), individual
-- account settings (phone/region, org membership), and multi-org membership
-- under a "primary org + switch" model: a profile still has exactly one
-- *active* org at a time (profiles.organization_id / current_org_id() is
-- unchanged, so none of the ~44 existing RLS policies keyed on it need to
-- change), but organization_members now tracks every org someone belongs
-- to, and switching reassigns which one is active.

-- Organization profile fields.
alter table public.organizations
  add column logo_path text,
  add column description text,
  add column org_type text,
  add column website text,
  add column email text,
  add column location text;

alter table public.organizations
  add constraint organizations_org_type_check
  check (org_type is null or org_type in (
    'nonprofit', 'government', 'company', 'academic', 'community', 'other'
  ));

-- Org logo storage — public bucket, same shape as the avatars bucket in
-- 0016, but scoped to org admins uploading under their own org's folder
-- instead of a user uploading under their own id.
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

create policy "Anyone can view org logos"
  on storage.objects for select
  using (bucket_id = 'org-logos');

create policy "Org admins can upload their org logo"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() = 'admin'
  );

create policy "Org admins can replace their org logo"
  on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() = 'admin'
  );

create policy "Org admins can delete their org logo"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.current_role() = 'admin'
  );

-- Individual profile fields.
alter table public.profiles
  add column phone text,
  add column region text;

-- Multi-org membership ledger. All writes go through the security-definer
-- RPCs below (admin-only, same-org, last-admin protection, invite-email
-- matching) — no direct insert/update/delete policy is granted, same
-- pattern as create_project relying on RPCs rather than raw table writes
-- for anything with business rules attached.
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role public.user_role not null,
  title text,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

alter table public.organization_members enable row level security;

create policy "Members can view their org's roster"
  on public.organization_members for select
  using (organization_id = public.current_org_id());

create policy "Users can view their own memberships"
  on public.organization_members for select
  using (user_id = auth.uid());

-- Backfill: every existing org-scoped profile becomes a membership row.
insert into public.organization_members (user_id, organization_id, role, title)
select id, organization_id, role, title
from public.profiles
where organization_id is not null
on conflict (user_id, organization_id) do nothing;

-- Extend signup to also record the membership row (both branches: joining
-- via an accepted invite, and creating a brand-new org as its first admin).
-- Individual-account branch is unchanged from 0007.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
  new_org_id uuid;
  meta_account_type text := coalesce(new.raw_user_meta_data ->> 'account_type', 'organization');
begin
  if meta_account_type = 'individual' then
    insert into public.profiles (id, account_type, full_name, country)
    values (
      new.id,
      'individual',
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      new.raw_user_meta_data ->> 'country'
    );
    return new;
  end if;

  select * into invite
    from public.org_invites
    where email = new.email and accepted_at is null
    order by created_at desc
    limit 1;

  if invite.id is not null then
    insert into public.profiles (id, organization_id, full_name, role, account_type)
    values (
      new.id,
      invite.organization_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      invite.role,
      'organization'
    );

    update public.org_invites set accepted_at = now() where id = invite.id;

    insert into public.organization_members (user_id, organization_id, role)
    values (new.id, invite.organization_id, invite.role)
    on conflict (user_id, organization_id) do nothing;
  else
    insert into public.organizations (name)
    values (
      coalesce(
        new.raw_user_meta_data ->> 'organization_name',
        split_part(new.email, '@', 1) || '''s organization'
      )
    )
    returning id into new_org_id;

    insert into public.profiles (id, organization_id, full_name, role, account_type)
    values (
      new.id,
      new_org_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'admin',
      'organization'
    );

    insert into public.organization_members (user_id, organization_id, role)
    values (new.id, new_org_id, 'admin');
  end if;

  return new;
end;
$$;

-- Removes someone from the caller's org entirely. Not a destructive account
-- delete — they keep their login, trees, badges, donations; they just lose
-- org access and become a normal individual account (satisfies the
-- existing profiles_account_type_shape check constraint). Has to run as a
-- security-definer RPC rather than a plain client update because "Admins
-- can update profiles in their organization" (0001) has
-- WITH CHECK (organization_id = current_org_id()), which would reject
-- nulling the column.
create or replace function public.remove_org_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid := public.current_org_id();
  target_role public.user_role;
  other_admin_count int;
begin
  if public.current_role() <> 'admin' then
    raise exception 'Only organization admins can remove members';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot remove yourself from the organization';
  end if;

  select role into target_role
  from public.organization_members
  where user_id = p_user_id and organization_id = caller_org;

  if target_role is null then
    raise exception 'That person is not a member of your organization';
  end if;

  if target_role = 'admin' then
    select count(*) into other_admin_count
    from public.organization_members
    where organization_id = caller_org and role = 'admin' and user_id <> p_user_id;
    if other_admin_count = 0 then
      raise exception 'Cannot remove the only remaining admin';
    end if;
  end if;

  delete from public.organization_members
  where user_id = p_user_id and organization_id = caller_org;

  -- Only clear their active-org profile fields if this org IS their
  -- active one — if they'd already switched elsewhere, leave that alone.
  update public.profiles
  set organization_id = null, role = null, title = null, account_type = 'individual'
  where id = p_user_id and organization_id = caller_org;
end;
$$;

-- Replaces the old plain-update "updateMemberAction" logic: updates the
-- durable membership record, and mirrors role/title onto profiles only
-- when this org is that member's currently active one.
create or replace function public.update_org_member(
  p_user_id uuid,
  p_role public.user_role,
  p_title text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid := public.current_org_id();
  current_role_of_target public.user_role;
  other_admin_count int;
begin
  if public.current_role() <> 'admin' then
    raise exception 'Only organization admins can manage the team';
  end if;

  select role into current_role_of_target
  from public.organization_members
  where user_id = p_user_id and organization_id = caller_org;

  if current_role_of_target is null then
    raise exception 'That person is not a member of your organization';
  end if;

  if current_role_of_target = 'admin' and p_role <> 'admin' then
    select count(*) into other_admin_count
    from public.organization_members
    where organization_id = caller_org and role = 'admin' and user_id <> p_user_id;
    if other_admin_count = 0 then
      raise exception 'Cannot demote the only remaining admin';
    end if;
  end if;

  update public.organization_members
  set role = p_role, title = nullif(p_title, '')
  where user_id = p_user_id and organization_id = caller_org;

  update public.profiles
  set role = p_role, title = nullif(p_title, '')
  where id = p_user_id and organization_id = caller_org;
end;
$$;

-- Switches which org is "active" for the caller. Every other RLS policy in
-- the app is keyed on current_org_id() (= profiles.organization_id), so
-- this is the only thing that actually changes what a multi-org user can
-- see/do — no policies elsewhere need to change.
create or replace function public.switch_active_organization(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  membership public.organization_members%rowtype;
begin
  select * into membership
  from public.organization_members
  where user_id = auth.uid() and organization_id = p_organization_id;

  if membership.id is null then
    raise exception 'You are not a member of that organization';
  end if;

  update public.profiles
  set organization_id = membership.organization_id,
      role = membership.role,
      title = membership.title,
      account_type = 'organization'
  where id = auth.uid();
end;
$$;

-- Lets an existing user see invitations addressed to their email, without
-- adding a new SELECT policy to org_invites (today only admins can read
-- invites for their own org) — same "expose just what's needed" pattern
-- as find_user_id_by_email / get_public_individual_profile.
create or replace function public.list_my_pending_invites()
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  role public.user_role,
  invited_by_name text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select i.id, i.organization_id, o.name, i.role, p.full_name, i.created_at
  from public.org_invites i
  join public.organizations o on o.id = i.organization_id
  left join public.profiles p on p.id = i.invited_by
  where i.accepted_at is null
    and i.email = (select email from auth.users where id = auth.uid())
  order by i.created_at desc;
$$;

-- Accepting an invite adds a membership; it only *activates* that org
-- immediately if the caller currently has no active org (a brand new
-- individual account accepting their first org invite) — otherwise it's
-- just added alongside whatever org is already active, switched to later.
create or replace function public.accept_org_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
  caller_email text;
  caller_has_active_org boolean;
begin
  select * into invite from public.org_invites where id = p_invite_id and accepted_at is null;
  if invite.id is null then
    raise exception 'That invitation is no longer available';
  end if;

  select email into caller_email from auth.users where id = auth.uid();
  if invite.email is distinct from caller_email then
    raise exception 'That invitation was not sent to your account';
  end if;

  insert into public.organization_members (user_id, organization_id, role)
  values (auth.uid(), invite.organization_id, invite.role)
  on conflict (user_id, organization_id) do update set role = excluded.role;

  update public.org_invites set accepted_at = now() where id = p_invite_id;

  select organization_id is null into caller_has_active_org
  from public.profiles where id = auth.uid();

  if caller_has_active_org then
    update public.profiles
    set organization_id = invite.organization_id,
        role = invite.role,
        account_type = 'organization'
    where id = auth.uid();
  end if;
end;
$$;

create or replace function public.decline_org_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
  caller_email text;
begin
  select * into invite from public.org_invites where id = p_invite_id and accepted_at is null;
  if invite.id is null then
    raise exception 'That invitation is no longer available';
  end if;

  select email into caller_email from auth.users where id = auth.uid();
  if invite.email is distinct from caller_email then
    raise exception 'That invitation was not sent to your account';
  end if;

  delete from public.org_invites where id = p_invite_id;
end;
$$;

-- "Request account deletion" (org or individual) only logs a request for
-- manual follow-up — nothing is auto-deleted. Matches how most enterprise
-- SaaS handles this, and avoids a risky cascading delete of projects,
-- trees, and donations with no human in the loop.
create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('organization', 'individual')),
  organization_id uuid references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint deletion_requests_target_shape check (
    (type = 'organization' and organization_id is not null and user_id is null)
    or (type = 'individual' and user_id is not null and organization_id is null)
  )
);

alter table public.deletion_requests enable row level security;

create policy "Org admins can request deletion of their org"
  on public.deletion_requests for insert
  with check (
    type = 'organization'
    and organization_id = public.current_org_id()
    and public.current_role() = 'admin'
    and requested_by = auth.uid()
  );

create policy "Users can request deletion of their own account"
  on public.deletion_requests for insert
  with check (
    type = 'individual'
    and user_id = auth.uid()
    and requested_by = auth.uid()
  );

create policy "Requesters can view their own deletion requests"
  on public.deletion_requests for select
  using (requested_by = auth.uid());
