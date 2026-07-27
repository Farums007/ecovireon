import type { FieldObservation } from "@/lib/queries/observations";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function observationsToCsv(observations: FieldObservation[]): string {
  const metricKeys = Array.from(
    new Set(observations.flatMap((o) => Object.keys(o.metrics)))
  );

  const header = ["observed_at", "latitude", "longitude", ...metricKeys, "notes"];
  const rows = observations.map((o) => [
    o.observedAt,
    o.location ? String(o.location.coordinates[1]) : "",
    o.location ? String(o.location.coordinates[0]) : "",
    ...metricKeys.map((key) => o.metrics[key] ?? ""),
    o.notes,
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}
