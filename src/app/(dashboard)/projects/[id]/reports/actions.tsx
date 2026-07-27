"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getProject } from "@/lib/queries/projects";
import { listObservations } from "@/lib/queries/observations";
import { observationsToCsv } from "@/lib/reports/csv";
import { ProjectReportPdf } from "@/lib/reports/pdf-report";

export type ReportFormState = { error: string } | null;

export async function generateReport(
  projectId: string,
  _prevState: ReportFormState,
  formData: FormData
): Promise<ReportFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    return { error: "Only admins can generate reports." };
  }

  const project = await getProject(projectId);
  if (!project) return { error: "Project not found." };

  const title = String(formData.get("title") ?? "");
  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");

  const allObservations = await listObservations(projectId);
  const startTime = new Date(periodStart).getTime();
  const endTime = new Date(periodEnd).getTime() + 24 * 60 * 60 * 1000 - 1;
  const observations = allObservations.filter((o) => {
    const t = new Date(o.observedAt).getTime();
    return t >= startTime && t <= endTime;
  });

  const latestByKey = new Map<string, number>();
  for (const o of [...observations].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  )) {
    for (const [key, value] of Object.entries(o.metrics)) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) latestByKey.set(key, numeric);
    }
  }
  const metricLatest = Array.from(latestByKey.entries()).map(([key, value]) => ({
    key,
    value,
  }));

  const csvContent = observationsToCsv(observations);
  const pdfBuffer = await renderToBuffer(
    <ProjectReportPdf
      project={project}
      title={title}
      periodStart={periodStart}
      periodEnd={periodEnd}
      observations={observations}
      metricLatest={metricLatest}
    />
  );

  const reportId = crypto.randomUUID();
  const basePath = `${profile.organizationId}/${projectId}/${reportId}`;
  const csvPath = `${basePath}.csv`;
  const pdfPath = `${basePath}.pdf`;

  const supabase = await createClient();

  const [csvUpload, pdfUpload] = await Promise.all([
    supabase.storage
      .from("report-exports")
      .upload(csvPath, csvContent, { contentType: "text/csv" }),
    supabase.storage
      .from("report-exports")
      .upload(pdfPath, new Blob([new Uint8Array(pdfBuffer)]), {
        contentType: "application/pdf",
      }),
  ]);

  if (csvUpload.error) return { error: csvUpload.error.message };
  if (pdfUpload.error) return { error: pdfUpload.error.message };

  const { error: insertError } = await supabase.from("reports").insert({
    id: reportId,
    project_id: projectId,
    title,
    period_start: periodStart,
    period_end: periodEnd,
    observation_count: observations.length,
    csv_path: csvPath,
    pdf_path: pdfPath,
    generated_by: profile.id,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath(`/projects/${projectId}/reports`);
  redirect(`/projects/${projectId}/reports`);
}
