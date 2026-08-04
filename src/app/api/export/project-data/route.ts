import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects } from "@/lib/queries/projects";
import { listObservations } from "@/lib/queries/observations";
import { listReports } from "@/lib/queries/reports";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId || profile.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const projects = await listProjects(profile.organizationId);
  const projectsWithData = await Promise.all(
    projects.map(async (project) => {
      const [observations, reports] = await Promise.all([
        listObservations(project.id),
        listReports(project.id),
      ]);
      return { ...project, observations, reports };
    })
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    projectCount: projectsWithData.length,
    projects: projectsWithData,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="project-data.json"`,
    },
  });
}
