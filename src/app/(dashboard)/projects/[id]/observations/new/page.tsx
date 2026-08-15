import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getProject, listProjectMembers, effectiveProjectRole } from "@/lib/queries/projects";
import { ObservationForm } from "@/app/(dashboard)/projects/[id]/observations/new/observation-form";

export default async function NewObservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, project, members] = await Promise.all([
    getCurrentProfile(),
    getProject(id),
    listProjectMembers(id),
  ]);
  if (!project) notFound();

  const myRole = effectiveProjectRole(project, profile, members);
  if (myRole !== "admin" && myRole !== "field_staff") redirect(`/projects/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground active:translate-y-px"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {project.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          New observation
        </h1>
        <p className="mt-1 text-muted-foreground">{project.name}</p>
      </div>
      <ObservationForm projectId={id} />
    </div>
  );
}
