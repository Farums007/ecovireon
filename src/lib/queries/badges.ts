import { createClient } from "@/lib/supabase/server";

export type Badge = {
  id: string;
  key: string;
  name: string;
  description: string;
  treeThreshold: number;
  icon: string;
  sortOrder: number;
};

function mapBadge(row: {
  id: string;
  key: string;
  name: string;
  description: string;
  tree_threshold: number;
  icon: string;
  sort_order: number;
}): Badge {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    treeThreshold: row.tree_threshold,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export async function listBadgeDefinitions(): Promise<Badge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBadge);
}

export type EarnedBadge = Badge & { earnedAt: string };

export async function listEarnedBadges(profileId: string): Promise<EarnedBadge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_badges")
    .select("earned_at, badges(*)")
    .eq("profile_id", profileId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;
      return badge ? { ...mapBadge(badge), earnedAt: row.earned_at } : null;
    })
    .filter((b): b is EarnedBadge => b !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
