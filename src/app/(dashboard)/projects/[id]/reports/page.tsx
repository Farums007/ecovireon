import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, FileText } from "lucide-react";
import { getProject } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listReports, getSignedReportUrls } from "@/lib/queries/reports";
import { ReportForm } from "@/app/(dashboard)/projects/[id]/reports/report-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, profile, reports] = await Promise.all([
    getProject(id),
    getCurrentProfile(),
    listReports(id),
  ]);
  if (!project) notFound();

  const allPaths = reports.flatMap((r) => [r.csvPath, r.pdfPath]);
  const signedUrls = await getSignedReportUrls(allPaths);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {project.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">{project.name}</p>
      </div>

      {profile?.role === "admin" && profile.organizationId === project.organizationId && (
        <ReportForm projectId={id} />
      )}

      <div className="space-y-3">
        {reports.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No reports generated yet.
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="border-border/80">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-muted-foreground">
                  {report.periodStart} – {report.periodEnd} ·{" "}
                  {report.observationCount} observations · generated{" "}
                  {new Date(report.generatedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-4">
                  {signedUrls[report.csvPath] && (
                    <a
                      href={signedUrls[report.csvPath]}
                      className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <FileSpreadsheet className="size-4" aria-hidden="true" />
                      CSV
                      <Download className="size-3.5" aria-hidden="true" />
                    </a>
                  )}
                  {signedUrls[report.pdfPath] && (
                    <a
                      href={signedUrls[report.pdfPath]}
                      className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <FileText className="size-4" aria-hidden="true" />
                      PDF
                      <Download className="size-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
