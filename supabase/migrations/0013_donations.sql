-- Donations: a payment record, decoupled from tree creation. Paying doesn't
-- itself create a tree — an admin later logs the actual tree(s) against the
-- donation (donation_id on trees), matching "our org plants trees and
-- attaches them to the donor's profile" from the product brief.

create type public.donation_status as enum ('pending', 'paid', 'failed');

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.profiles (id),
  donor_email text not null,
  donor_name text not null default '',
  project_id uuid references public.projects (id),
  organization_id uuid references public.organizations (id),
  tree_count integer not null,
  amount_kobo bigint not null,
  currency text not null default 'NGN',
  payment_provider text not null default 'paystack',
  payment_reference text unique not null,
  status public.donation_status not null default 'pending',
  trees_fulfilled integer not null default 0,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index donations_donor_id_idx on public.donations (donor_id);
create index donations_organization_id_idx on public.donations (organization_id);
create index donations_status_idx on public.donations (status);

alter table public.trees add column donation_id uuid references public.donations (id);

alter table public.donations enable row level security;

create policy "Donors can view their own donations"
  on public.donations for select
  using (donor_id = auth.uid());

create policy "Platform admins can view all donations"
  on public.donations for select
  using (public.current_is_platform_admin());

create policy "Org members can view donations assigned to their org"
  on public.donations for select
  using (organization_id = public.current_org_id());

-- Donors must be signed in (donor_id = auth.uid(), never null) — trees.owner_id
-- is not-null, and a donation only becomes creditable impact once a tree is
-- logged against it, so an owning profile is required from the start.
create policy "Signed-in users can create their own pending donation"
  on public.donations for insert
  with check (status = 'pending' and donor_id = auth.uid());

-- Status transitions (pending -> paid/failed) only happen server-side via
-- the Paystack webhook, using the service role key (which bypasses RLS
-- entirely) — no update policy is needed or granted to normal users.

-- Platform admins (donation fulfillment) and org staff can log a tree
-- against a paid donation, crediting the donor as owner while the staff
-- member who physically planted it is planted_by.
create or replace function public.fulfill_donation_tree(
  p_donation_id uuid,
  p_species text,
  p_height_note text,
  p_location_label text,
  p_soil_type text,
  p_notes text,
  p_photo_path text,
  p_lat double precision,
  p_lng double precision
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  donation record;
  new_id uuid;
begin
  select * into donation from public.donations where id = p_donation_id;
  if donation.id is null then
    raise exception 'Donation not found';
  end if;
  if donation.status <> 'paid' then
    raise exception 'Donation has not been paid yet';
  end if;
  if not (
    public.current_is_platform_admin()
    or (donation.organization_id is not null and donation.organization_id = public.current_org_id())
  ) then
    raise exception 'Not authorized to fulfill this donation';
  end if;

  insert into public.trees (
    planted_by, owner_id, organization_id, donation_id, species, height_note,
    location_label, soil_type, notes, photo_path, location, status
  ) values (
    auth.uid(), donation.donor_id, donation.organization_id, donation.id,
    p_species, p_height_note, p_location_label, p_soil_type, p_notes, p_photo_path,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    'pending'
  )
  returning id into new_id;

  update public.donations
    set trees_fulfilled = trees_fulfilled + 1
    where id = p_donation_id;

  return new_id;
end;
$$;
