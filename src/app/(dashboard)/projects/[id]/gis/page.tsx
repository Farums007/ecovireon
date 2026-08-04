import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getProject } from "@/lib/queries/projects";
import { listObservations } from "@/lib/queries/observations";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ProjectBoundaryMap } from "@/components/map/project-boundary-map";
import { Button } from "@/components/ui/button";

export default async function ProjectGisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, profile, observations] = await Promise.all([
    getProject(id),
    getCurrentProfile(),
    listObservations(id),
  ]);
  if (!project) notFound();

  const isOwnerOrgAdmin =
    profile?.role === "admin" && profile.organizationId === project.organizationId;

  const mappedObservations = observations
    .filter((o) => o.location)
    .map((o) => ({ id: o.id, location: o.location! }));

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Project boundary and field observation locations.
        </p>
        {isOwnerOrgAdmin && (
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link href={`/projects/${id}/edit`}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit boundary
              </Link>
            }
          />
        )}
      </div>
      <div className="h-[32rem] w-full overflow-hidden rounded-xl border border-border shadow-sm">
        <ProjectBoundaryMap boundary={project.boundary} observations={mappedObservations} showStyleSwitcher />
      </div>
    </div>
  );
}
