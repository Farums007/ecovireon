-- Atomic increment for a donor's public total, called by the Paystack
-- webhook (via the service role, which bypasses RLS) when a payment clears.
create or replace function public.increment_donations_total(
  p_profile_id uuid,
  p_amount_kobo bigint
) returns void
language sql
set search_path = public
as $$
  update public.profiles
  set donations_total_kobo = donations_total_kobo + p_amount_kobo
  where id = p_profile_id
$$;
