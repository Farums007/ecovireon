import { createClient } from "@/lib/supabase/server";

export type TreeCheckin = {
  id: string;
  treeId: string;
  submittedBy: string;
  photoPath: string | null;
  heightNote: string | null;
  notes: string | null;
  observedAt: string;
  createdAt: string;
};

function mapRow(row: {
  id: string;
  tree_id: string;
  submitted_by: string;
  photo_path: string | null;
  height_note: string | null;
  notes: string | null;
  observed_at: string;
  created_at: string;
}): TreeCheckin {
  return {
    id: row.id,
    treeId: row.tree_id,
    submittedBy: row.submitted_by,
    photoPath: row.photo_path,
    heightNote: row.height_note,
    notes: row.notes,
    observedAt: row.observed_at,
    createdAt: row.created_at,
  };
}

export async function listTreeCheckins(treeId: string): Promise<TreeCheckin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tree_checkins")
    .select("*")
    .eq("tree_id", treeId)
    .order("observed_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}
