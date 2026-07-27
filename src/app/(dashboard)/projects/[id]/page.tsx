import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, PlusCircle, Users2 } from "lucide-react";
import {
  getProject,
  listProjectMembers,
} from "@/lib/queries/projects";
import { listObservations, getSignedPhotoUrls } from "@/lib/queries/observations";
import { getProjectMetrics } from "@/lib/queries/dashboard";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ProjectBoundaryMap } from "@/components/map/project-boundary-map";
import { MetricsDashboard } from "@/app/(dashboard)/projects/[id]/metrics-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  restoration: "Restoration",
  conservation: "Conservation",
  urban_forestry: "Urban forestry",
  carbon: "Carbon-ready",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, members, observations, profile, metrics] = await Promise.all([
    getProject(id),
    listProjectMembers(id),
    listObservations(id),
    getCurrentProfile(),
    getProjectMetrics(id),
  ]);
  if (!project) notFound();

  const allPhotoPaths = observations.flatMap((o) => o.photoUrls);
  const signedPhotoUrls = await getSignedPhotoUrls(allPhotoPaths);

  const mappedObservations = observations
    .filter((o) => o.location)
    .map((o) => ({ id: o.id, location: o.location! }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to projects
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {TYPE_LABELS[project.projectType]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="capitalize">{project.status}</Badge>
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link href={`/projects/${id}/reports`}>
                <FileText className="size-4" aria-hidden="true" />
                Reports
              </Link>
            }
          />
          {profile?.role !== "verifier" && (
            <Button
              nativeButton={false}
              size="sm"
              render={
                <Link href={`/projects/${id}/observations/new`}>
                  <PlusCircle className="size-4" aria-hidden="true" />
                  New observation
                </Link>
              }
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-96 w-full overflow-hidden rounded-xl border border-border shadow-sm">
            <ProjectBoundaryMap
              boundary={project.boundary}
              observations={mappedObservations}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.description && (
                <p className="text-foreground/90">{project.description}</p>
              )}
              <p className="text-muted-foreground">
                {project.startDate ?? "No start date"} —{" "}
                {project.endDate ?? "No end date"}
              </p>
              {project.goals.length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {project.goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Users2 className="size-4 text-muted-foreground" aria-hidden="true" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {members.length === 0 ? (
                <p className="text-muted-foreground">
                  No members assigned beyond org admins and field staff.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between"
                  >
                    <span>{member.fullName}</span>
                    <span className="text-muted-foreground capitalize">{member.role}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Monitoring</h2>
        <MetricsDashboard cards={metrics.cards} series={metrics.series} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">
          Field observations
        </h2>
        {observations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No observations submitted yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {observations.map((observation) => (
              <Card key={observation.id} className="border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    {new Date(observation.observedAt).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(observation.metrics).length > 0 && (
                    <ul className="space-y-1 text-muted-foreground">
                      {Object.entries(observation.metrics).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium text-foreground">
                            {key}:
                          </span>{" "}
                          {value}
                        </li>
                      ))}
                    </ul>
                  )}
                  {observation.notes && <p>{observation.notes}</p>}
                  {observation.photoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {observation.photoUrls.map((path) =>
                        signedPhotoUrls[path] ? (
                          <a
                            key={path}
                            href={signedPhotoUrls[path]}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            <Image
                              src={signedPhotoUrls[path]}
                              alt="Field observation photo"
                              width={80}
                              height={80}
                              unoptimized
                              className="h-20 w-20 rounded-md border border-border object-cover"
                            />
                          </a>
                        ) : null
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
