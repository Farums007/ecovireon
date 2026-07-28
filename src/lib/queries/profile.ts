import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/storage-urls";

export type PublicIndividualProfile = {
  id: string;
  fullName: string;
  country: string | null;
  treesPlantedCount: number;
  co2EstimatedKg: number;
  avatarUrl: string | null;
};

// Safe-fields-only lookup for the public share profile — no email,
// no donation totals, works for any visitor via get_public_individual_profile.
export async function getPublicIndividualProfile(
  id: string
): Promise<PublicIndividualProfile | null> {
  const supabase = await createClient();
  const { data: rpcData, error } = await supabase
    .rpc("get_public_individual_profile", { p_id: id })
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!rpcData) return null;

  const data = rpcData as {
    id: string;
    full_name: string;
    country: string | null;
    trees_planted_count: number;
    co2_estimated_kg: number;
    avatar_path: string | null;
  };

  return {
    id: data.id,
    fullName: data.full_name,
    country: data.country,
    treesPlantedCount: data.trees_planted_count,
    co2EstimatedKg: Number(data.co2_estimated_kg),
    avatarUrl: data.avatar_path ? getAvatarUrl(data.avatar_path) : null,
  };
}

export type Role = "admin" | "field_staff" | "verifier";
export type AccountType = "organization" | "individual";

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  role: Role | null;
  organizationId: string | null;
  organizationName: string | null;
  country: string | null;
  isPlatformAdmin: boolean;
  treesPlantedCount: number;
  co2EstimatedKg: number;
  donationsTotalKobo: number;
  avatarPath: string | null;
  avatarUrl: string | null;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, account_type, role, organization_id, country, is_platform_admin, trees_planted_count, co2_estimated_kg, donations_total_kobo, avatar_path, organizations(name)"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  const organization = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  return {
    id: data.id,
    email: user.email ?? "",
    fullName: data.full_name,
    accountType: data.account_type,
    role: data.role,
    organizationId: data.organization_id,
    organizationName: organization?.name ?? null,
    country: data.country,
    isPlatformAdmin: data.is_platform_admin,
    treesPlantedCount: data.trees_planted_count,
    co2EstimatedKg: Number(data.co2_estimated_kg),
    donationsTotalKobo: Number(data.donations_total_kobo),
    avatarPath: data.avatar_path,
    avatarUrl: data.avatar_path ? getAvatarUrl(data.avatar_path) : null,
  };
}
