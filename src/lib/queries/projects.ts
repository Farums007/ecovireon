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
}): Project {
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

export type ProjectMember = {
  userId: string;
  fullName: string;
  role: string;
};

export async function listProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id, profiles(full_name, role)")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id,
      fullName: profile?.full_name ?? "",
      role: profile?.role ?? "",
    };
  });
}
