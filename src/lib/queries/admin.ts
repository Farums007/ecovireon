import { createClient } from "@/lib/supabase/server";

export type AdminStats = {
  totalTrees: number;
  approvedTrees: number;
  pendingTrees: number;
  flaggedTrees: number;
  totalUsers: number;
  individualUsers: number;
  organizationCount: number;
  totalDonatedKobo: number;
  pendingDeletionRequests: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [
    totalTrees,
    approvedTrees,
    pendingTrees,
    flaggedTrees,
    totalUsers,
    individualUsers,
    organizationCount,
    paidDonations,
    pendingDeletionRequests,
  ] = await Promise.all([
    supabase.from("trees").select("*", { count: "exact", head: true }),
    supabase.from("trees").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("trees").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("trees").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_type", "individual"),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("donations").select("amount_kobo").eq("status", "paid"),
    supabase
      .from("deletion_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const totalDonatedKobo = (paidDonations.data ?? []).reduce(
    (sum, d) => sum + Number(d.amount_kobo),
    0
  );

  return {
    totalTrees: totalTrees.count ?? 0,
    approvedTrees: approvedTrees.count ?? 0,
    pendingTrees: pendingTrees.count ?? 0,
    flaggedTrees: flaggedTrees.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    individualUsers: individualUsers.count ?? 0,
    organizationCount: organizationCount.count ?? 0,
    totalDonatedKobo,
    pendingDeletionRequests: pendingDeletionRequests.count ?? 0,
  };
}

export type ReviewTree = {
  id: string;
  species: string;
  status: string;
  photoPath: string;
  observedAt: string;
  gpsAccuracyM: number | null;
  ownerName: string;
};

export type TreeStatusFilter =
  | "review"
  | "pending"
  | "flagged"
  | "approved"
  | "rejected"
  | "all";

export async function listTreesForReview(
  filter: TreeStatusFilter = "review"
): Promise<ReviewTree[]> {
  const supabase = await createClient();
  let query = supabase
    .from("trees")
    .select("id, species, status, photo_path, observed_at, gps_accuracy_m, owner_id");

  if (filter === "review") {
    query = query.in("status", ["pending", "flagged"]).order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
  }

  const { data: trees, error } = await query;

  if (error) throw new Error(error.message);
  if (!trees || trees.length === 0) return [];

  const ownerIds = [...new Set(trees.map((t) => t.owner_id))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ownerIds);

  const nameById = new Map((owners ?? []).map((o) => [o.id, o.full_name]));

  return trees.map((t) => ({
    id: t.id,
    species: t.species,
    status: t.status,
    photoPath: t.photo_path,
    observedAt: t.observed_at,
    gpsAccuracyM: t.gps_accuracy_m,
    ownerName: nameById.get(t.owner_id) ?? "Unknown",
  }));
}

export type AdminDonation = {
  id: string;
  donorName: string;
  donorEmail: string;
  treeCount: number;
  treesFulfilled: number;
  amountKobo: number;
  status: string;
  createdAt: string;
  projectId: string | null;
};

export async function listAllDonations(): Promise<AdminDonation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, donor_name, donor_email, tree_count, trees_fulfilled, amount_kobo, status, created_at, project_id"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((d) => ({
    id: d.id,
    donorName: d.donor_name,
    donorEmail: d.donor_email,
    treeCount: d.tree_count,
    treesFulfilled: d.trees_fulfilled,
    amountKobo: Number(d.amount_kobo),
    status: d.status,
    createdAt: d.created_at,
    projectId: d.project_id,
  }));
}

export async function getDonation(id: string): Promise<AdminDonation | null> {
  const donations = await listAllDonations();
  return donations.find((d) => d.id === id) ?? null;
}

export type AdminUser = {
  id: string;
  fullName: string;
  accountType: string;
  role: string | null;
  organizationName: string | null;
  country: string | null;
  treesPlantedCount: number;
  isPlatformAdmin: boolean;
  createdAt: string;
  isBanned: boolean;
};

export async function listAllUsers(
  accountType?: "individual" | "organization"
): Promise<AdminUser[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, account_type, role, country, trees_planted_count, is_platform_admin, created_at, organizations(name)"
    )
    .order("created_at", { ascending: false });

  if (accountType) query = query.eq("account_type", accountType);

  const [{ data, error }, { data: banStatus }] = await Promise.all([
    query,
    supabase.rpc("list_user_ban_status"),
  ]);

  if (error) throw new Error(error.message);

  const bannedIds = new Set(
    ((banStatus ?? []) as { id: string; banned_until: string | null }[])
      .filter((row) => row.banned_until && new Date(row.banned_until) > new Date())
      .map((row) => row.id)
  );

  return (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return {
      id: row.id,
      fullName: row.full_name,
      accountType: row.account_type,
      role: row.role,
      organizationName: org?.name ?? null,
      country: row.country,
      isBanned: bannedIds.has(row.id),
      treesPlantedCount: row.trees_planted_count,
      isPlatformAdmin: row.is_platform_admin,
      createdAt: row.created_at,
    };
  });
}

export type DeletionRequestStatus = "pending" | "completed" | "cancelled";

export type AdminDeletionRequest = {
  id: string;
  type: "organization" | "individual";
  targetName: string;
  requestedByName: string;
  reason: string | null;
  status: DeletionRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
};

// Platform-admin view across every deletion request, org or individual —
// gated by the "Platform admins can view all deletion requests" RLS policy
// (0031). deletion_requests has two separate FKs into profiles (user_id,
// requested_by), which PostgREST can't embed unambiguously in one query,
// so names are resolved with a follow-up batch lookup instead, same
// pattern as listTreesForReview's owner-name lookup above.
export async function listDeletionRequests(
  status?: DeletionRequestStatus
): Promise<AdminDeletionRequest[]> {
  const supabase = await createClient();
  let query = supabase
    .from("deletion_requests")
    .select(
      "id, type, organization_id, user_id, requested_by, reason, status, created_at, resolved_at, target_name"
    )
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const orgIds = [
    ...new Set(data.filter((r) => r.organization_id).map((r) => r.organization_id as string)),
  ];
  const profileIds = [
    ...new Set(
      [
        ...data.filter((r) => r.user_id).map((r) => r.user_id as string),
        ...data.map((r) => r.requested_by),
      ].filter((id): id is string => id !== null)
    ),
  ];

  const [{ data: orgs }, { data: profiles }] = await Promise.all([
    orgIds.length
      ? supabase.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    profileIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const orgNameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // Once resolved, target_name is a snapshot taken at deletion time — the
  // live join can no longer find the org/user by then (its FK was nulled
  // by ON DELETE SET NULL when the row was removed), so prefer the
  // snapshot whenever it's set.
  return data.map((row) => ({
    id: row.id,
    type: row.type,
    targetName:
      row.target_name ??
      (row.type === "organization"
        ? (orgNameById.get(row.organization_id as string) ?? "Unknown organization")
        : (nameById.get(row.user_id as string) ?? "Unknown user")),
    requestedByName: row.requested_by ? (nameById.get(row.requested_by) ?? "Unknown") : "—",
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}

export type AdminProject = {
  id: string;
  name: string;
  organizationName: string;
  status: string;
  projectType: string;
  isPublic: boolean;
  createdAt: string;
};

// Platform-admin view across every org's projects, gated by the
// "Platform admins can view all projects" RLS policy (0023) — a regular
// org admin's own listProjects() stays org-scoped as before.
export async function listAllProjectsForAdmin(): Promise<AdminProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, project_type, is_public, created_at, organizations(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return {
      id: row.id,
      name: row.name,
      organizationName: org?.name ?? "Unknown",
      status: row.status,
      projectType: row.project_type,
      isPublic: row.is_public,
      createdAt: row.created_at,
    };
  });
}
