-- Individual (non-organization) accounts alongside existing org accounts.

create type public.account_type as enum ('organization', 'individual');

alter table public.profiles
  alter column organization_id drop not null,
  alter column role drop not null,
  alter column role drop default,
  add column account_type public.account_type not null default 'organization',
  add column country text,
  add column is_platform_admin boolean not null default false,
  add column trees_planted_count integer not null default 0,
  add column co2_estimated_kg numeric not null default 0,
  add column donations_total_kobo bigint not null default 0;

alter table public.profiles
  add constraint profiles_account_type_shape check (
    (account_type = 'organization' and organization_id is not null and role is not null)
    or (account_type = 'individual' and organization_id is null and role is null)
  );

-- Individuals have no organization_id for the existing org-scoped SELECT
-- policy to match against, so they couldn't see even their own profile.
-- Additive (permissive) policy — combines with the existing one via OR.
create policy "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid());

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
  end if;

  return new;
end;
$$;

update public.profiles set is_platform_admin = true
where id = (select id from auth.users where email = 'arumsefrancis+ecotest@gmail.com');
