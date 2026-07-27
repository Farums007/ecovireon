import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ProjectForm } from "@/app/(dashboard)/projects/new/project-form";

export default async function NewProjectPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/projects");

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
        <h1 className="mt-3 text-2xl font-bold tracking-tight">New project</h1>
        <p className="mt-1 text-muted-foreground">
          Define the project details and trace its site boundary on the map.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
