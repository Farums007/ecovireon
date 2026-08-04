import { createClient } from "@/lib/supabase/server";

export type ProjectStatus =
  | "planning"
  | "active"
  | "monitoring"
  | "completed"
  | "archived";
export type ProjectType =
  | "restoration"
  | "conservation"
  | "urban_forestry"
  | "carbon";
export type RestorationType =
  | "forest"
  | "mangrove"
  | "wetland"
  | "grassland"
  | "coral"
  | "agroforestry"
  | "biodiversity"
  | "other";

export const RESTORATION_TYPE_LABELS: Record<RestorationType, string> = {
  forest: "Forest",
  mangrove: "Mangrove",
  wetland: "Wetland",
  grassland: "Grassland",
  coral: "Coral",
  agroforestry: "Agroforestry",
  biodiversity: "Biodiversity",
  other: "Other",
};

// Asset label per restoration type, used wherever a verified observation
// is presented as a "Restoration Asset" (project tab, org-wide gallery).
export const RESTORATION_ASSET_LABELS: Record<RestorationType, string> = {
  forest: "Tree",
  mangrove: "Mangrove Stand",
  wetland: "Monitoring Point",
  grassland: "Plot",
  coral: "Coral Colony",
  agroforestry: "Plot",
  biodiversity: "Observation Point",
  other: "Restoration Asset",
};

export type PublicSections = {
  overview: boolean;
  map: boolean;
  photos: boolean;
  monitoring: boolean;
  impact: boolean;
  partners: boolean;
};

export type Polygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type Point = {
  type: "Point";
  coordinates: [number, number];
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  projectType: ProjectType;
  startDate: string | null;
  endDate: string | null;
  goals: string[];
  createdBy: string;
  createdAt: string;
  boundary: Polygon | null;
  isPublic: boolean;
  restorationType: RestorationType;
  country: string | null;
  region: string | null;
  fundingSource: string | null;
  budget: number | null;
  expectedOutcomes: string | null;
  publicSections: PublicSections;
  areaHa: number | null;
};

function mapRow(row: {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  project_type: ProjectType;
  start_date: string | null;
  end_date: string | null;
  goals: unknown;
  created_by: string;
  created_at: string;
  boundary_geojson: Polygon | null;
  is_public: boolean;
  restoration_type: RestorationType;
  country: string | null;
  region: string | null;
  funding_source: string | null;
  budget: number | string | null;
  expected_outcomes: string | null;
  public_sections: unknown;
  area_ha: number | string | null;
}): Project {
  const defaultSections: PublicSections = {
    overview: true,
    map: true,
    photos: true,
    monitoring: true,
    impact: true,
    partners: true,
  };
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    status: row.status,
    projectType: row.project_type,
    startDate: row.start_date,
    endDate: row.end_date,
    goals: Array.isArray(row.goals) ? (row.goals as string[]) : [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    boundary: row.boundary_geojson,
    isPublic: row.is_public,
    restorationType: row.restoration_type,
    country: row.country,
    region: row.region,
    fundingSource: row.funding_source,
    budget: row.budget === null ? null : Number(row.budget),
    expectedOutcomes: row.expected_outcomes,
    publicSections:
      row.public_sections && typeof row.public_sections === "object"
        ? { ...defaultSections, ...(row.public_sections as Partial<PublicSections>) }
        : defaultSections,
    areaHa: row.area_ha === null ? null : Number(row.area_ha),
  };
}

// Scoped to one org (the dashboard registry). Without this filter, RLS
// would also surface *other* orgs' public-flagged projects here, since
// "Anyone can view public projects" is a separate permissive policy.
export async function listProjects(organizationId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects_geo")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

// For anonymous/public surfaces (marketing homepage, /explore) — relies on
// the "Anyone can view public projects" RLS policy, works for anon too.
export async function listPublicProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects_geo")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects_geo")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export type ProjectRole = "admin" | "field_staff" | "verifier";

export type ProjectMember = {
  userId: string;
  fullName: string;
  role: ProjectRole;
  title: string | null;
};

export async function listProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id, role, title, profiles(full_name)")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id,
      fullName: profile?.full_name ?? "",
      role: row.role,
      title: row.title,
    };
  });
}

// A caller's org-wide role only applies to projects their own org owns.
// For a project they were added to from outside that org (or as an
// individual, who has no org role at all), their access is governed by
// their project_members.role instead. Mirrors can_access_project/
// project_member_role in migration 0017 — keep in sync with those.
export function effectiveProjectRole(
  project: Pick<Project, "organizationId">,
  profile: { id: string; organizationId: string | null; role: ProjectRole | null } | null,
  members: Pick<ProjectMember, "userId" | "role">[]
): ProjectRole | null {
  if (!profile) return null;
  if (profile.organizationId && profile.organizationId === project.organizationId) {
    return profile.role;
  }
  return members.find((m) => m.userId === profile.id)?.role ?? null;
}

export type MyProject = {
  project: Project;
  role: ProjectRole;
  title: string | null;
};

// Projects the current user has been added to directly (not necessarily
// their own org's registry) — the individual-account "your projects" view.
// project_members has no FK to the projects_geo *view*, only the raw
// table, so this can't be a single embedded query — fetch memberships,
// then each project through the same GeoJSON-safe path getProject uses.
export async function listMyProjects(userId: string): Promise<MyProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id, role, title")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const projects = await Promise.all(data.map((row) => getProject(row.project_id)));

  return data
    .map((row, i) => ({ project: projects[i], role: row.role, title: row.title }))
    .filter((entry): entry is MyProject => entry.project !== null);
}
