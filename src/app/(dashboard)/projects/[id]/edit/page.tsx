import { notFound, redirect } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ProjectForm } from "@/app/(dashboard)/projects/new/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect(`/projects/${id}`);

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>
      <ProjectForm project={project} />
    </div>
  );
}
