import { notFound } from "next/navigation";
import { listObservationsByStatus } from "@/lib/queries/observations";
import { getProject } from "@/lib/queries/projects";
import { VerificationCard } from "@/app/(dashboard)/projects/[id]/verification-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProjectVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, observations] = await Promise.all([
    getProject(id),
    listObservationsByStatus(id, ["pending", "needs_review"]),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {observations.length} observation{observations.length === 1 ? "" : "s"} awaiting verification.
      </p>
      {observations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nothing to verify. You&apos;re all caught up.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {observations.map((observation) => (
            <VerificationCard key={observation.id} observation={observation} projectId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
