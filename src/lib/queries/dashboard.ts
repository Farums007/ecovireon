import { createClient } from "@/lib/supabase/server";
import type { Point } from "@/lib/queries/projects";

export type OrgDashboardStats = {
  activeProjects: number;
  areaRestoredHa: number;
  restorationAssetsCount: number;
  pendingVerifications: number;
  upcomingMonitoringCount: number;
  estimatedCarbonKg: number;
};

// Executive KPI row for the Mission Control dashboard. Area comes from
// org_restoration_area_ha (0024) since summing PostGIS geography area
// needs to happen in SQL; everything else is derived here from plain
// counts to avoid depending on exotic embedded-filter query syntax.
export async function getOrgDashboardStats(organizationId: string): Promise<OrgDashboardStats> {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("organization_id", organizationId);
  if (projectsError) throw new Error(projectsError.message);

  const projectIds = (projects ?? []).map((p) => p.id);
  const activeProjects = (projects ?? []).filter(
    (p) => p.status === "active" || p.status === "monitoring"
  ).length;

  const [{ data: area }, { data: observations }] = await Promise.all([
    supabase.rpc("org_restoration_area_ha", { p_organization_id: organizationId }),
    projectIds.length > 0
      ? supabase
          .from("field_observations")
          .select("id, project_id, verification_status, observed_at")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] as { id: string; project_id: string; verification_status: string; observed_at: string }[] }),
  ]);

  const obsRows = observations ?? [];
  const restorationAssetsCount = obsRows.filter((o) => o.verification_status === "verified").length;
  const pendingVerifications = obsRows.filter(
    (o) => o.verification_status === "pending" || o.verification_status === "needs_review"
  ).length;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const lastObservedByProject = new Map<string, number>();
  for (const o of obsRows) {
    const t = new Date(o.observed_at).getTime();
    const existing = lastObservedByProject.get(o.project_id);
    if (!existing || t > existing) lastObservedByProject.set(o.project_id, t);
  }
  const upcomingMonitoringCount = projectIds.filter((id) => {
    const last = lastObservedByProject.get(id);
    return !last || last < thirtyDaysAgo;
  }).length;

  // Placeholder estimate, same order of magnitude as the individual
  // side's per-tree co2_estimate_kg (~21kg/tree average) — no dedicated
  // carbon model exists yet on the org side.
  const estimatedCarbonKg = restorationAssetsCount * 21;

  return {
    activeProjects,
    areaRestoredHa: Number(area ?? 0),
    restorationAssetsCount,
    pendingVerifications,
    upcomingMonitoringCount,
    estimatedCarbonKg,
  };
}

export type ActivityEvent = {
  id: string;
  type: "project_created" | "observation_submitted" | "observation_verified" | "report_generated" | "member_joined";
  label: string;
  timestamp: string;
  href: string;
};

// Synthesized from existing timestamped tables — no dedicated
// activity_log table yet. Fine at this data volume; revisit if it ever
// needs to scale beyond "everything for one org, sorted client-side."
export async function listOrgActivity(organizationId: string, limit = 20): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("organization_id", organizationId);
  if (projectsError) throw new Error(projectsError.message);

  const projectIds = (projects ?? []).map((p) => p.id);
  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  const [obsRes, reportsRes, membersRes] = await Promise.all([
    projectIds.length > 0
      ? supabase
          .from("field_observations")
          .select("id, project_id, created_at, verification_status, reviewed_at")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length > 0
      ? supabase.from("reports").select("id, project_id, title, generated_at").in("project_id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("profiles").select("id, full_name, created_at").eq("organization_id", organizationId),
  ]);

  if (obsRes.error) throw new Error(obsRes.error.message);
  if (reportsRes.error) throw new Error(reportsRes.error.message);
  if (membersRes.error) throw new Error(membersRes.error.message);

  const events: ActivityEvent[] = [];

  for (const p of projects ?? []) {
    events.push({
      id: `project-${p.id}`,
      type: "project_created",
      label: `Project "${p.name}" created`,
      timestamp: p.created_at,
      href: `/projects/${p.id}`,
    });
  }
  for (const o of obsRes.data ?? []) {
    const projectName = projectNameById.get(o.project_id) ?? "a project";
    events.push({
      id: `obs-${o.id}`,
      type: "observation_submitted",
      label: `Field observation submitted for ${projectName}`,
      timestamp: o.created_at,
      href: `/projects/${o.project_id}`,
    });
    if (o.verification_status === "verified" && o.reviewed_at) {
      events.push({
        id: `obs-verified-${o.id}`,
        type: "observation_verified",
        label: `Observation verified for ${projectName}`,
        timestamp: o.reviewed_at,
        href: `/projects/${o.project_id}`,
      });
    }
  }
  for (const r of reportsRes.data ?? []) {
    const projectName = projectNameById.get(r.project_id) ?? "a project";
    events.push({
      id: `report-${r.id}`,
      type: "report_generated",
      label: `Report "${r.title}" generated for ${projectName}`,
      timestamp: r.generated_at,
      href: `/projects/${r.project_id}/reports`,
    });
  }
  for (const m of membersRes.data ?? []) {
    events.push({
      id: `member-${m.id}`,
      type: "member_joined",
      label: `${m.full_name || "A team member"} joined the organization`,
      timestamp: m.created_at,
      href: "/teams",
    });
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export type UpcomingTask = {
  id: string;
  label: string;
  href: string;
};

// Plain rule-based list, deliberately not AI-generated or automated —
// "N observations pending verification", "project X has no monitoring
// in 30 days", "project Y has never had a report".
export async function getUpcomingTasks(organizationId: string): Promise<UpcomingTask[]> {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", organizationId);
  if (projectsError) throw new Error(projectsError.message);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (projectIds.length === 0) return [];

  const [{ data: observations }, { data: reports }] = await Promise.all([
    supabase
      .from("field_observations")
      .select("project_id, observed_at, verification_status")
      .in("project_id", projectIds),
    supabase.from("reports").select("project_id").in("project_id", projectIds),
  ]);

  const tasks: UpcomingTask[] = [];

  const pendingCount = (observations ?? []).filter(
    (o) => o.verification_status === "pending" || o.verification_status === "needs_review"
  ).length;
  if (pendingCount > 0) {
    tasks.push({
      id: "pending-verification",
      label: `Review ${pendingCount} observation${pendingCount === 1 ? "" : "s"} pending verification`,
      href: "/verification",
    });
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const lastObservedByProject = new Map<string, number>();
  for (const o of observations ?? []) {
    const t = new Date(o.observed_at).getTime();
    const existing = lastObservedByProject.get(o.project_id);
    if (!existing || t > existing) lastObservedByProject.set(o.project_id, t);
  }
  for (const p of projects ?? []) {
    const last = lastObservedByProject.get(p.id);
    if (!last || last < thirtyDaysAgo) {
      tasks.push({
        id: `monitoring-due-${p.id}`,
        label: `Monitoring visit due for "${p.name}"`,
        href: `/projects/${p.id}`,
      });
    }
  }

  const projectIdsWithReports = new Set((reports ?? []).map((r) => r.project_id));
  for (const p of projects ?? []) {
    if (!projectIdsWithReports.has(p.id)) {
      tasks.push({
        id: `no-report-${p.id}`,
        label: `Generate a report for "${p.name}"`,
        href: `/projects/${p.id}/reports`,
      });
    }
  }

  return tasks.slice(0, 8);
}

export type OrgObservationMarker = {
  id: string;
  projectId: string;
  location: Point;
};

export async function listOrgObservationMarkers(): Promise<
  OrgObservationMarker[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_observations_geo")
    .select("id, project_id, location_geojson")
    .order("observed_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.location_geojson)
    .map((row) => ({
      id: row.id,
      projectId: row.project_id,
      location: row.location_geojson as Point,
    }));
}

export type MetricSeries = {
  key: string;
  points: { date: string; value: number }[];
};

export type MetricCard = {
  key: string;
  latestValue: number;
  latestDate: string;
};

export async function getProjectMetrics(projectId: string): Promise<{
  series: MetricSeries[];
  cards: MetricCard[];
  observationCount: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("field_observations_geo")
    .select("observed_at, metrics")
    .eq("project_id", projectId)
    .order("observed_at", { ascending: true });

  if (error) throw new Error(error.message);

  const seriesByKey = new Map<string, { date: string; value: number }[]>();

  for (const row of data ?? []) {
    const metrics = row.metrics as Record<string, string> | null;
    if (!metrics) continue;
    for (const [key, rawValue] of Object.entries(metrics)) {
      const value = Number(rawValue);
      if (Number.isNaN(value)) continue;
      const points = seriesByKey.get(key) ?? [];
      points.push({ date: row.observed_at, value });
      seriesByKey.set(key, points);
    }
  }

  const series = Array.from(seriesByKey.entries()).map(([key, points]) => ({
    key,
    points,
  }));

  const cards = series.map(({ key, points }) => {
    const latest = points[points.length - 1];
    return { key, latestValue: latest.value, latestDate: latest.date };
  });

  return { series, cards, observationCount: (data ?? []).length };
}
