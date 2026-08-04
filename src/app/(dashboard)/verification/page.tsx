import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects } from "@/lib/queries/projects";
import { listOrgObservationsByStatus } from "@/lib/queries/observations";
import { VerificationCard } from "@/app/(dashboard)/projects/[id]/verification-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function VerificationQueuePage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const projects = await listProjects(profile.organizationId);
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
  const observations = await listOrgObservationsByStatus(
    projects.map((p) => p.id),
    ["pending", "needs_review"]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="mt-1 text-muted-foreground">
          {observations.length} observation{observations.length === 1 ? "" : "s"} awaiting verification across every project.
        </p>
      </div>

      {observations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing to verify. You&apos;re all caught up.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {observations.map((observation) => (
            <VerificationCard
              key={observation.id}
              observation={observation}
              projectId={observation.projectId}
              projectName={projectNameById.get(observation.projectId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
