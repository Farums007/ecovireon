import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/storage-urls";

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
