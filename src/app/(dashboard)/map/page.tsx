import { redirect } from "next/navigation";
import { listProjects } from "@/lib/queries/projects";
import { listOrgObservationMarkers } from "@/lib/queries/dashboard";
import { getCurrentProfile } from "@/lib/queries/profile";
import { OrgMap } from "@/components/map/org-map";

export default async function OrgMapPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) redirect("/projects");

  const [projects, observations] = await Promise.all([
    listProjects(profile.organizationId),
    listOrgObservationMarkers(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Map</h1>
        <p className="mt-1 text-muted-foreground">
          All project sites and recent field observations.
        </p>
      </div>
      <div className="h-[calc(100vh-14rem)] min-h-96 w-full overflow-hidden rounded-xl border border-border shadow-sm">
        <OrgMap
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            boundary: p.boundary,
          }))}
          observations={observations}
        />
      </div>
    </div>
  );
}
