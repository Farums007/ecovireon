import Link from "next/link";
import { FolderPlus, Globe2, MapPinned } from "lucide-react";
import { listProjects, RESTORATION_TYPE_LABELS } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  restoration: "Restoration",
  conservation: "Conservation",
  urban_forestry: "Urban forestry",
  carbon: "Carbon-ready",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  planning: "outline",
  active: "default",
  monitoring: "default",
  completed: "secondary",
  archived: "secondary",
};

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  const projects = profile?.organizationId
    ? await listProjects(profile.organizationId)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.organizationName}&apos;s nature-based project registry.
          </p>
        </div>
        {profile?.role === "admin" && (
          <Button
            nativeButton={false}
            render={
              <Link href="/projects/new">
                <FolderPlus className="size-4" aria-hidden="true" />
                New project
              </Link>
            }
          />
        )}
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <MapPinned className="size-6 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="pt-2">No projects yet</CardTitle>
            <CardDescription>
              {profile?.role === "admin"
                ? "Create your first project to start tracking its site boundary and monitoring data."
                : "Nothing has been added to the registry yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Card className="h-full border-border/80 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0 active:shadow-none">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant={STATUS_VARIANTS[project.status]} className="shrink-0 capitalize">
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1.5">
                    {RESTORATION_TYPE_LABELS[project.restorationType]} · {TYPE_LABELS[project.projectType]}
                    {project.isPublic && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Globe2 className="size-3.5" aria-hidden="true" />
                        Public
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
