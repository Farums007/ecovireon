-- Badge definitions, earned badges, and the tree-approval flow that
-- updates a profile's public stats and awards badges.

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text not null,
  tree_threshold integer not null,
  icon text not null,
  sort_order integer not null
);

create table public.profile_badges (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;

create policy "Anyone can view badge definitions"
  on public.badges for select
  using (true);

create policy "Anyone can view earned badges"
  on public.profile_badges for select
  using (true);

insert into public.badges (key, name, description, tree_threshold, icon, sort_order) values
  ('seedling', 'Seedling', 'Planted your first verified tree', 1, '🌱', 1),
  ('sprout', 'Sprout', 'Planted 5 verified trees', 5, '🌿', 2),
  ('grove_grower', 'Grove Grower', 'Planted 10 verified trees', 10, '🌳', 3),
  ('forest_builder', 'Forest Builder', 'Planted 25 verified trees', 25, '🌲', 4),
  ('habitat_hero', 'Habitat Hero', 'Planted 50 verified trees', 50, '🦋', 5),
  ('restoration_champion', 'Restoration Champion', 'Planted 100 verified trees', 100, '🏆', 6),
  ('ecosystem_guardian', 'Ecosystem Guardian', 'Planted 250 verified trees', 250, '🌍', 7),
  ('climate_defender', 'Climate Defender', 'Planted 500 verified trees', 500, '⚡', 8),
  ('legacy_planter', 'Legacy Planter', 'Planted 1000 verified trees', 1000, '👑', 9);

-- Approving is the "verified" moment: only now do a tree's stats count
-- toward the owner's public totals and badges. security definer + an
-- explicit platform-admin check, since this writes across trees, profiles,
-- and profile_badges — beyond what the caller's own row-level grants allow.
create or replace function public.approve_tree(p_tree_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  tree record;
  new_count integer;
  co2_per_tree constant numeric := 21; -- placeholder average kg CO2/tree
  awarded text[] := '{}';
  badge record;
begin
  if not public.current_is_platform_admin() then
    raise exception 'Only platform admins can approve trees';
  end if;

  select * into tree from public.trees where id = p_tree_id;
  if tree.id is null then
    raise exception 'Tree not found';
  end if;
  if tree.status = 'approved' then
    return awarded;
  end if;

  update public.trees
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), co2_estimate_kg = co2_per_tree
    where id = p_tree_id;

  update public.profiles
    set trees_planted_count = trees_planted_count + 1,
        co2_estimated_kg = co2_estimated_kg + co2_per_tree
    where id = tree.owner_id
    returning trees_planted_count into new_count;

  for badge in
    select * from public.badges
    where tree_threshold <= new_count
      and id not in (select badge_id from public.profile_badges where profile_id = tree.owner_id)
  loop
    insert into public.profile_badges (profile_id, badge_id) values (tree.owner_id, badge.id);
    awarded := array_append(awarded, badge.key);
  end loop;

  return awarded;
end;
$$;

create or replace function public.reject_tree(p_tree_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_is_platform_admin() then
    raise exception 'Only platform admins can reject trees';
  end if;

  update public.trees
    set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_tree_id;

  if not found then
    raise exception 'Tree not found';
  end if;
end;
$$;
