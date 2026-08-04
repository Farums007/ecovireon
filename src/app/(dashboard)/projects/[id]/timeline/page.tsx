import { notFound } from "next/navigation";
import { getProject, listProjectMembers } from "@/lib/queries/projects";
import { listObservations } from "@/lib/queries/observations";
import { listReports } from "@/lib/queries/reports";
import { Card, CardContent } from "@/components/ui/card";

type TimelineEvent = { label: string; timestamp: string };

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, observations, reports, members] = await Promise.all([
    getProject(id),
    listObservations(id),
    listReports(id),
    listProjectMembers(id),
  ]);
  if (!project) notFound();

  const events: TimelineEvent[] = [{ label: "Project created", timestamp: project.createdAt }];

  if (project.boundary) {
    events.push({ label: "Boundary defined", timestamp: project.createdAt });
  }
  if (members.length > 0) {
    events.push({ label: "Team assigned", timestamp: project.createdAt });
  }

  const sortedObservations = [...observations].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );
  if (sortedObservations.length > 0) {
    events.push({ label: "Field operations started", timestamp: sortedObservations[0].observedAt });
  }

  const verified = observations
    .filter((o) => o.verificationStatus === "verified" && o.reviewedAt)
    .sort((a, b) => new Date(a.reviewedAt!).getTime() - new Date(b.reviewedAt!).getTime());
  if (verified.length > 0) {
    events.push({ label: "First observation verified", timestamp: verified[0].reviewedAt! });
  }

  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
  );
  if (sortedReports.length > 0) {
    events.push({ label: `Report published: "${sortedReports[0].title}"`, timestamp: sortedReports[0].generatedAt });
  }

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="max-w-xl space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Key milestones for this project, derived automatically from its records.
      </p>
      <Card>
        <CardContent className="pt-6">
          <ol className="relative space-y-6 border-l border-border pl-6">
            {events.map((event, i) => (
              <li key={`${event.label}-${i}`} className="relative">
                <span
                  className="absolute top-1 -left-[1.65rem] size-2.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-foreground">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
