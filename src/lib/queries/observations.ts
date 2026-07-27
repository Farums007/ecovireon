import { createClient } from "@/lib/supabase/server";
import type { Point } from "@/lib/queries/projects";

export type FieldObservation = {
  id: string;
  projectId: string;
  siteId: string | null;
  submittedBy: string;
  observedAt: string;
  metrics: Record<string, string>;
  notes: string;
  photoUrls: string[];
  location: Point | null;
};

function mapRow(row: {
  id: string;
  project_id: string;
  site_id: string | null;
  submitted_by: string;
  observed_at: string;
  metrics: unknown;
  notes: string;
  photo_urls: string[];
  location_geojson: Point | null;
}): FieldObservation {
  return {
    id: row.id,
    projectId: row.project_id,
    siteId: row.site_id,
    submittedBy: row.submitted_by,
    observedAt: row.observed_at,
    metrics:
      row.metrics && typeof row.metrics === "object"
        ? (row.metrics as Record<string, string>)
        : {},
    notes: row.notes,
    photoUrls: row.photo_urls ?? [],
    location: row.location_geojson,
  };
}

export async function listObservations(
  projectId: string
): Promise<FieldObservation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_observations_geo")
    .select("*")
    .eq("project_id", projectId)
    .order("observed_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getSignedPhotoUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("field-photos")
    .createSignedUrls(paths, 3600);

  if (error) throw new Error(error.message);

  const result: Record<string, string> = {};
  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) result[entry.path] = entry.signedUrl;
  });
  return result;
}
