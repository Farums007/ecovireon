import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getProject, listProjectMembers } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ProjectBoundaryMap } from "@/components/map/project-boundary-map";
import { DeleteProjectButton } from "@/app/(dashboard)/projects/[id]/delete-project-button";
import { TeamCard } from "@/app/(dashboard)/projects/[id]/team-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, profile, members] = await Promise.all([
    getProject(id),
    getCurrentProfile(),
    listProjectMembers(id),
  ]);
  if (!project) notFound();

  const isOwnerOrgAdmin =
    profile?.role === "admin" && profile.organizationId === project.organizationId;

  return (
    <div className="space-y-6 pt-4">
      {isOwnerOrgAdmin && (
        <div className="flex justify-end gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={
              <Link href={`/projects/${id}/edit`}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Link>
            }
          />
          <DeleteProjectButton projectId={id} projectName={project.name} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-96 w-full overflow-hidden rounded-xl border border-border shadow-sm">
            <ProjectBoundaryMap boundary={project.boundary} observations={[]} />
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

          <TeamCard projectId={id} members={members} canManage={isOwnerOrgAdmin} />
        </div>
      </div>
    </div>
  );
}
