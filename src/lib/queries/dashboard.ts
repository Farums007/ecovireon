import { createClient } from "@/lib/supabase/server";
import type { Point } from "@/lib/queries/projects";

export type OrgObservationMarker = {
  id: string;
  projectId: string;
  location: Point;
};

export async function listOrgObservationMarkers(): Promise<
  OrgObservationMarker[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_observations_geo")
    .select("id, project_id, location_geojson")
    .order("observed_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.location_geojson)
    .map((row) => ({
      id: row.id,
      projectId: row.project_id,
      location: row.location_geojson as Point,
    }));
}

export type MetricSeries = {
  key: string;
  points: { date: string; value: number }[];
};

export type MetricCard = {
  key: string;
  latestValue: number;
  latestDate: string;
};

export async function getProjectMetrics(projectId: string): Promise<{
  series: MetricSeries[];
  cards: MetricCard[];
  observationCount: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_observations_geo")
    .select("observed_at, metrics")
    .eq("project_id", projectId)
    .order("observed_at", { ascending: true });

  if (error) throw new Error(error.message);

  const seriesByKey = new Map<string, { date: string; value: number }[]>();

  for (const row of data ?? []) {
    const metrics = row.metrics as Record<string, string> | null;
    if (!metrics) continue;
    for (const [key, rawValue] of Object.entries(metrics)) {
      const value = Number(rawValue);
      if (Number.isNaN(value)) continue;
      const points = seriesByKey.get(key) ?? [];
      points.push({ date: row.observed_at, value });
      seriesByKey.set(key, points);
    }
  }

  const series = Array.from(seriesByKey.entries()).map(([key, points]) => ({
    key,
    points,
  }));

  const cards = series.map(({ key, points }) => {
    const latest = points[points.length - 1];
    return { key, latestValue: latest.value, latestDate: latest.date };
  });

  return { series, cards, observationCount: (data ?? []).length };
}
