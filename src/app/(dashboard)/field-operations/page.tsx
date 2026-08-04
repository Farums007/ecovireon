import Link from "next/link";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects } from "@/lib/queries/projects";
import { listOrgObservationsByStatus } from "@/lib/queries/observations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  needs_review: "Needs review",
  rejected: "Rejected",
};

export default async function FieldOperationsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const projects = await listProjects(profile.organizationId);
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
  const observations = await listOrgObservationsByStatus(
    projects.map((p) => p.id),
    ["pending", "verified", "needs_review", "rejected"]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Field Operations</h1>
        <p className="mt-1 text-muted-foreground">
          {observations.length} field observation{observations.length === 1 ? "" : "s"} across
          every project. Submit a new one from a project&apos;s Field Operations tab.
        </p>
      </div>

      {observations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No field observations submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {observations.map((observation) => (
            <Link
              key={observation.id}
              href={`/projects/${observation.projectId}/field-operations`}
              className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Card className="h-full border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">
                      {new Date(observation.observedAt).toLocaleDateString()}
                    </CardTitle>
                    <Badge
                      variant={observation.verificationStatus === "verified" ? "default" : "outline"}
                    >
                      {VERIFICATION_LABELS[observation.verificationStatus]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {projectNameById.get(observation.projectId) ?? "Project"}
                  </p>
                </CardHeader>
                {observation.notes && (
                  <CardContent className="text-sm text-muted-foreground">
                    {observation.notes}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
