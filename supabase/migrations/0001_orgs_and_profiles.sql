-- Organizations, profiles, roles, and signup wiring.
-- Run in the Supabase SQL Editor, or via `supabase db push` if the CLI is linked.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'field_staff', 'verifier');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'field_staff',
  created_at timestamptz not null default now()
);

-- Pending invitations: an admin creates a row for an email/role, and the
-- signup trigger below attaches that user to the invited org instead of
-- creating a brand new organization for them.
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'field_staff',
  invited_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index org_invites_email_idx on public.org_invites (email) where accepted_at is null;

-- Helper functions used by RLS policies. security definer + a fixed
-- search_path avoids recursive-RLS issues when policies on `profiles`
-- itself need to know the caller's org/role.
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Creates the profile (and organization, if not invited) for every new
-- auth.users row. security definer so it can bypass RLS during signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
  new_org_id uuid;
begin
  select * into invite
    from public.org_invites
    where email = new.email and accepted_at is null
    order by created_at desc
    limit 1;

  if invite.id is not null then
    insert into public.profiles (id, organization_id, full_name, role)
    values (
      new.id,
      invite.organization_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      invite.role
    );

    update public.org_invites set accepted_at = now() where id = invite.id;
  else
    insert into public.organizations (name)
    values (
      coalesce(
        new.raw_user_meta_data ->> 'organization_name',
        split_part(new.email, '@', 1) || '''s organization'
      )
    )
    returning id into new_org_id;

    insert into public.profiles (id, organization_id, full_name, role)
    values (
      new.id,
      new_org_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      'admin'
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.org_invites enable row level security;

create policy "Members can view their own organization"
  on public.organizations for select
  using (id = public.current_org_id());

create policy "Members can view profiles in their organization"
  on public.profiles for select
  using (organization_id = public.current_org_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update profiles in their organization"
  on public.profiles for update
  using (organization_id = public.current_org_id() and public.current_role() = 'admin')
  with check (organization_id = public.current_org_id());

create policy "Admins can view invites for their organization"
  on public.org_invites for select
  using (organization_id = public.current_org_id() and public.current_role() = 'admin');

create policy "Admins can create invites for their organization"
  on public.org_invites for insert
  with check (organization_id = public.current_org_id() and public.current_role() = 'admin');

create policy "Admins can delete invites for their organization"
  on public.org_invites for delete
  using (organization_id = public.current_org_id() and public.current_role() = 'admin');
