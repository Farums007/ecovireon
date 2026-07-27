import { createClient } from "@/lib/supabase/server";

export type Report = {
  id: string;
  projectId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  observationCount: number;
  csvPath: string;
  pdfPath: string;
  generatedBy: string;
  generatedAt: string;
};

function mapRow(row: {
  id: string;
  project_id: string;
  title: string;
  period_start: string;
  period_end: string;
  observation_count: number;
  csv_path: string;
  pdf_path: string;
  generated_by: string;
  generated_at: string;
}): Report {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    observationCount: row.observation_count,
    csvPath: row.csv_path,
    pdfPath: row.pdf_path,
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
  };
}

export async function listReports(projectId: string): Promise<Report[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getSignedReportUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("report-exports")
    .createSignedUrls(paths, 3600);

  if (error) throw new Error(error.message);

  const result: Record<string, string> = {};
  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) result[entry.path] = entry.signedUrl;
  });
  return result;
}
