import { createClient } from "@/lib/supabase/server";
import type { ProjectRole } from "@/lib/queries/projects";

export type OrgMember = {
  id: string;
  fullName: string;
  role: ProjectRole;
  title: string | null;
  createdAt: string;
};

export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, title, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    role: row.role as ProjectRole,
    title: row.title,
    createdAt: row.created_at,
  }));
}

export type OrgInvite = {
  id: string;
  email: string;
  role: ProjectRole;
  createdAt: string;
};

export async function listPendingOrgInvites(organizationId: string): Promise<OrgInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_invites")
    .select("id, email, role, created_at")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as ProjectRole,
    createdAt: row.created_at,
  }));
}
