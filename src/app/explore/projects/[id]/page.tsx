import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getProject } from "@/lib/queries/projects";
import { getProjectMetrics } from "@/lib/queries/dashboard";
import { listObservations, getSignedPhotoUrls } from "@/lib/queries/observations";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ProjectBoundaryMap } from "@/components/map/project-boundary-map";
import { MetricsDashboard } from "@/app/(dashboard)/projects/[id]/metrics-dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  restoration: "Restoration",
  conservation: "Conservation",
  urban_forestry: "Urban forestry",
  carbon: "Carbon-ready",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return {
    title: project ? project.name : "Project not found",
    description: project?.description,
  };
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project || !project.isPublic) notFound();

  const [metrics, observations] = await Promise.all([
    getProjectMetrics(id),
    listObservations(id),
  ]);

  const allPhotoPaths = observations.flatMap((o) => o.photoUrls);
  const signedPhotoUrls = await getSignedPhotoUrls(allPhotoPaths);
  const mappedObservations = observations
    .filter((o) => o.location)
    .map((o) => ({ id: o.id, location: o.location! }));

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the map
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
            <p className="mt-1 text-muted-foreground">{TYPE_LABELS[project.projectType]}</p>
          </div>
          <Badge className="capitalize">{project.status}</Badge>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {project.publicSections.map && (
            <div className="lg:col-span-2">
              <div className="h-80 w-full overflow-hidden rounded-xl border border-border shadow-sm">
                <ProjectBoundaryMap boundary={project.boundary} observations={mappedObservations} />
              </div>
            </div>
          )}
          {project.publicSections.overview && (
            <Card className={project.publicSections.map ? "" : "lg:col-span-3"}>
              <CardHeader>
                <CardTitle className="text-sm">About this project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {project.description && <p className="text-foreground/90">{project.description}</p>}
                <p className="text-muted-foreground">
                  {project.startDate ?? "No start date"} — {project.endDate ?? "No end date"}
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
          )}
        </div>

        {project.publicSections.impact && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Area under restoration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {project.areaHa ? `${project.areaHa.toFixed(1)} ha` : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Verified Restoration Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {observations.filter((o) => o.verificationStatus === "verified").length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {project.publicSections.monitoring && metrics.observationCount > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Monitoring progress</h2>
            <MetricsDashboard cards={metrics.cards} series={metrics.series} />
          </div>
        )}

        {project.publicSections.monitoring && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Field updates</h2>
            {observations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No field updates yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {observations.map((observation) => (
                  <Card key={observation.id} className="border-border/80">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">
                        {new Date(observation.observedAt).toLocaleDateString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {Object.entries(observation.metrics).length > 0 && (
                        <ul className="space-y-1 text-muted-foreground">
                          {Object.entries(observation.metrics).map(([key, value]) => (
                            <li key={key}>
                              <span className="font-medium text-foreground">{key}:</span> {value}
                            </li>
                          ))}
                        </ul>
                      )}
                      {observation.notes && <p>{observation.notes}</p>}
                      {project.publicSections.photos && observation.photoUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {observation.photoUrls.map((path) =>
                            signedPhotoUrls[path] ? (
                              <Image
                                key={path}
                                src={signedPhotoUrls[path]}
                                alt="Field update photo"
                                width={80}
                                height={80}
                                unoptimized
                                className="h-20 w-20 rounded-md border border-border object-cover"
                              />
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
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
