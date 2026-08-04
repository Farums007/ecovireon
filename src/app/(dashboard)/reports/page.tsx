import Link from "next/link";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects } from "@/lib/queries/projects";
import { listOrgReports, getSignedReportUrls } from "@/lib/queries/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrgReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const projects = await listProjects(profile.organizationId);
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
  const reports = await listOrgReports(projects.map((p) => p.id));
  const signedUrls = await getSignedReportUrls(reports.flatMap((r) => [r.csvPath, r.pdfPath]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Every report generated across {profile.organizationName}&apos;s projects. Generate a new
          one from a project&apos;s Reports tab.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No reports generated yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="border-border/80">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-muted-foreground">
                  <Link
                    href={`/projects/${report.projectId}/reports`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {projectNameById.get(report.projectId) ?? "Project"}
                  </Link>
                  {" · "}
                  {report.periodStart} – {report.periodEnd} · {report.observationCount} observations
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
          ))}
        </div>
      )}
    </div>
  );
}
