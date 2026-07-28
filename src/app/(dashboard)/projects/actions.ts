"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Polygon, ProjectStatus, ProjectType } from "@/lib/queries/projects";

export type ProjectFormState = { error: string } | null;

function parseGoals(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseBoundary(raw: string): Polygon | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.type === "Polygon" ? (parsed as Polygon) : null;
  } catch {
    return null;
  }
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const supabase = await createClient();

  const { data: newId, error } = await supabase.rpc("create_project", {
    p_name: String(formData.get("name") ?? ""),
    p_description: String(formData.get("description") ?? ""),
    p_project_type: String(formData.get("projectType") ?? "") as ProjectType,
    p_status: String(formData.get("status") ?? "planning") as ProjectStatus,
    p_start_date: formData.get("startDate") || null,
    p_end_date: formData.get("endDate") || null,
    p_goals: parseGoals(String(formData.get("goals") ?? "")),
    p_boundary_geojson: parseBoundary(String(formData.get("boundary") ?? "")),
    p_is_public: formData.get("isPublic") === "on",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  redirect(`/projects/${newId}`);
}

export async function updateProject(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_project", {
    p_id: projectId,
    p_name: String(formData.get("name") ?? ""),
    p_description: String(formData.get("description") ?? ""),
    p_project_type: String(formData.get("projectType") ?? "") as ProjectType,
    p_status: String(formData.get("status") ?? "planning") as ProjectStatus,
    p_start_date: formData.get("startDate") || null,
    p_end_date: formData.get("endDate") || null,
    p_goals: parseGoals(String(formData.get("goals") ?? "")),
    p_boundary_geojson: parseBoundary(String(formData.get("boundary") ?? "")),
    p_is_public: formData.get("isPublic") === "on",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export type DeleteProjectState = { error: string } | null;

export async function deleteProject(
  projectId: string,
  _prevState: DeleteProjectState,
  _formData: FormData
): Promise<DeleteProjectState> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    return {
      error: error.message.includes("foreign key")
        ? "This project can't be deleted while it still has donations, reports, or other records attached to it."
        : error.message,
    };
  }

  revalidatePath("/projects");
  redirect("/projects");
}
