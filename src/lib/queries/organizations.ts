import { createClient } from "@/lib/supabase/server";
import { getOrgLogoUrl } from "@/lib/storage-urls";

export type OrgType =
  | "nonprofit"
  | "government"
  | "company"
  | "academic"
  | "community"
  | "other";

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  nonprofit: "Nonprofit / NGO",
  government: "Government agency",
  company: "Private company",
  academic: "Academic / research institution",
  community: "Community-based organization",
  other: "Other",
};

export type OrganizationProfile = {
  id: string;
  name: string;
  description: string | null;
  orgType: OrgType | null;
  website: string | null;
  email: string | null;
  location: string | null;
  logoPath: string | null;
  logoUrl: string | null;
};

function mapRow(row: {
  id: string;
  name: string;
  description: string | null;
  org_type: OrgType | null;
  website: string | null;
  email: string | null;
  location: string | null;
  logo_path: string | null;
}): OrganizationProfile {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    orgType: row.org_type,
    website: row.website,
    email: row.email,
    location: row.location,
    logoPath: row.logo_path,
    logoUrl: row.logo_path ? getOrgLogoUrl(row.logo_path) : null,
  };
}

export async function getOrganizationProfile(
  organizationId: string
): Promise<OrganizationProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, org_type, website, email, location, logo_path")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export type PendingDeletionRequest = {
  id: string;
  reason: string | null;
  createdAt: string;
};

export async function getPendingOrgDeletionRequest(
  organizationId: string
): Promise<PendingDeletionRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deletion_requests")
    .select("id, reason, created_at")
    .eq("type", "organization")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? { id: data.id, reason: data.reason, createdAt: data.created_at } : null;
}

export async function getMyPendingDeletionRequest(): Promise<PendingDeletionRequest | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("deletion_requests")
    .select("id, reason, created_at")
    .eq("type", "individual")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? { id: data.id, reason: data.reason, createdAt: data.created_at } : null;
}
