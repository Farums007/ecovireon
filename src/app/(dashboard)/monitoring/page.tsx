import Link from "next/link";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects, RESTORATION_TYPE_LABELS } from "@/lib/queries/projects";
import { listOrgObservationsByStatus } from "@/lib/queries/observations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MonitoringPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const projects = await listProjects(profile.organizationId);
  const observations = await listOrgObservationsByStatus(
    projects.map((p) => p.id),
    ["pending", "verified", "needs_review", "rejected"]
  );

  const countByProject = new Map<string, number>();
  const lastObservedByProject = new Map<string, string>();
  for (const o of observations) {
    countByProject.set(o.projectId, (countByProject.get(o.projectId) ?? 0) + 1);
    const existing = lastObservedByProject.get(o.projectId);
    if (!existing || new Date(o.observedAt) > new Date(existing)) {
      lastObservedByProject.set(o.projectId, o.observedAt);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
        <p className="mt-1 text-muted-foreground">
          Monitoring coverage across every project. Open a project for its full metrics.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No projects yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const lastObserved = lastObservedByProject.get(project.id);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/monitoring`}
                className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Card className="h-full border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">{project.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {RESTORATION_TYPE_LABELS[project.restorationType]}
                    </p>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {countByProject.get(project.id) ?? 0} observation
                      {(countByProject.get(project.id) ?? 0) === 1 ? "" : "s"}
                    </span>
                    <Badge variant="outline">
                      {lastObserved ? new Date(lastObserved).toLocaleDateString() : "No data"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
