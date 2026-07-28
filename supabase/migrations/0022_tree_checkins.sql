-- Growth check-ins: an append-only log of progress updates an owner adds
-- to their own tree over time (photo + note), separate from the original
-- planting record in trees. Visible to anyone who can already see the
-- tree itself (approved = public, otherwise owner/planter only).

create table public.tree_checkins (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.trees (id) on delete cascade,
  submitted_by uuid not null references public.profiles (id),
  photo_path text,
  height_note text,
  notes text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index tree_checkins_tree_id_idx on public.tree_checkins (tree_id);

alter table public.tree_checkins enable row level security;

create policy "Anyone can view checkins for approved trees"
  on public.tree_checkins for select
  using (
    exists (
      select 1 from public.trees t
      where t.id = tree_checkins.tree_id and t.status = 'approved'
    )
  );

create policy "Owners and planters can view checkins for their own trees"
  on public.tree_checkins for select
  using (
    exists (
      select 1 from public.trees t
      where t.id = tree_checkins.tree_id
        and (t.owner_id = auth.uid() or t.planted_by = auth.uid())
    )
  );

create policy "Owners can add checkins to their own trees"
  on public.tree_checkins for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.trees t
      where t.id = tree_checkins.tree_id and t.owner_id = auth.uid()
    )
  );
