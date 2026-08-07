import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getProject,
  listProjectMembers,
  effectiveProjectRole,
  RESTORATION_TYPE_LABELS,
} from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ShareButton } from "@/components/share-button";
import { ProjectTabs } from "@/app/(dashboard)/projects/[id]/project-tabs";
import { Badge } from "@/components/ui/badge";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
  const myRole = effectiveProjectRole(project, profile, members);
  const hasAccess = isOwnerOrgAdmin || myRole !== null;
  if (!hasAccess) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to projects
        </Link>
      </div>

      <div className="sticky top-14 z-20 -mx-4 space-y-3 bg-background px-4 pt-1 pb-1 sm:-mx-6 sm:px-6 lg:static lg:top-auto lg:mx-0 lg:space-y-4 lg:bg-transparent lg:px-0 lg:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {RESTORATION_TYPE_LABELS[project.restorationType]}
              {project.country ? ` · ${project.country}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="capitalize">{project.status}</Badge>
            {project.isPublic && (
              <ShareButton
                url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/explore/projects/${id}`}
                text={`See the progress on ${project.name}, a restoration project on Ecovireon.`}
                label="Share"
                size="sm"
              />
            )}
          </div>
        </div>

        <ProjectTabs projectId={id} showSettings={isOwnerOrgAdmin} />
      </div>

      {children}
    </div>
  );
}
