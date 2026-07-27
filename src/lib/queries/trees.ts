import { createClient } from "@/lib/supabase/server";
import type { Point } from "@/lib/queries/projects";

export type TreeStatus = "pending" | "approved" | "rejected" | "flagged";

export type Tree = {
  id: string;
  plantedBy: string;
  ownerId: string;
  organizationId: string | null;
  species: string;
  heightNote: string | null;
  locationLabel: string | null;
  soilType: string | null;
  notes: string | null;
  photoPath: string;
  gpsAccuracyM: number | null;
  observedAt: string;
  status: TreeStatus;
  rejectionReason: string | null;
  co2EstimateKg: number;
  createdAt: string;
  location: Point | null;
  ownerName: string | null;
};

function mapRow(row: {
  id: string;
  planted_by: string;
  owner_id: string;
  organization_id: string | null;
  species: string;
  height_note: string | null;
  location_label: string | null;
  soil_type: string | null;
  notes: string | null;
  photo_path: string;
  gps_accuracy_m: number | null;
  observed_at: string;
  status: TreeStatus;
  rejection_reason: string | null;
  co2_estimate_kg: number;
  created_at: string;
  location_geojson: Point | null;
  owner_name: string | null;
}): Tree {
  return {
    id: row.id,
    plantedBy: row.planted_by,
    ownerId: row.owner_id,
    organizationId: row.organization_id,
    species: row.species,
    heightNote: row.height_note,
    locationLabel: row.location_label,
    soilType: row.soil_type,
    notes: row.notes,
    photoPath: row.photo_path,
    gpsAccuracyM: row.gps_accuracy_m,
    observedAt: row.observed_at,
    status: row.status,
    rejectionReason: row.rejection_reason,
    co2EstimateKg: Number(row.co2_estimate_kg),
    createdAt: row.created_at,
    location: row.location_geojson,
    ownerName: row.owner_name,
  };
}

export async function listApprovedTrees(): Promise<Tree[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trees_geo")
    .select("*")
    .eq("status", "approved")
    .order("observed_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getTree(id: string): Promise<Tree | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trees_geo")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function listMyTrees(): Promise<Tree[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trees_geo")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}
