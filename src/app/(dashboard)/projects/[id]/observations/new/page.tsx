import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getProject } from "@/lib/queries/projects";
import { ObservationForm } from "@/app/(dashboard)/projects/[id]/observations/new/observation-form";

export default async function NewObservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (profile && profile.role === "verifier") redirect(`/projects/${id}`);

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
