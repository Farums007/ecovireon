import { createClient } from "@/lib/supabase/server";
import type { ProjectRole } from "@/lib/queries/projects";

export type OrgMember = {
  id: string;
  fullName: string;
  role: ProjectRole;
  title: string | null;
  createdAt: string;
};

// Reads the org's roster from organization_members (every real member,
// regardless of which org happens to be their currently *active* one) —
// not from profiles.organization_id, which only reflects the active org.
export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, title, created_at, profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.user_id,
      fullName: profile?.full_name ?? "",
      role: row.role as ProjectRole,
      title: row.title,
      createdAt: row.created_at,
    };
  });
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

export type MyOrgMembership = {
  organizationId: string;
  organizationName: string;
  role: ProjectRole;
  title: string | null;
};

// Every org the current user belongs to, for the Organization Memberships
// section of individual account settings — not scoped to their currently
// active org.
export async function listMyOrgMemberships(): Promise<MyOrgMembership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, title, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return {
      organizationId: row.organization_id,
      organizationName: org?.name ?? "Organization",
      role: row.role as ProjectRole,
      title: row.title,
    };
  });
}

export type MyPendingInvite = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: ProjectRole;
  invitedByName: string | null;
  createdAt: string;
};

export async function listMyPendingInvites(): Promise<MyPendingInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_my_pending_invites");

  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{
    id: string;
    organization_id: string;
    organization_name: string;
    role: ProjectRole;
    invited_by_name: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    role: row.role,
    invitedByName: row.invited_by_name,
    createdAt: row.created_at,
  }));
}
