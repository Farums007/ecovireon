import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getOrganizationProfile } from "@/lib/queries/organizations";
import { listOrgMembers, listPendingOrgInvites } from "@/lib/queries/teams";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId || profile.role !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const supabase = await createClient();
  const [organization, members, invites] = await Promise.all([
    getOrganizationProfile(profile.organizationId),
    listOrgMembers(profile.organizationId),
    listPendingOrgInvites(profile.organizationId),
  ]);

  // supabase-js typing has no bearing on RLS here — just reused for the
  // one field (created_at) not already covered by the query helpers above.
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("created_at")
    .eq("id", profile.organizationId)
    .maybeSingle();

  const payload = {
    exportedAt: new Date().toISOString(),
    organization: { ...organization, createdAt: orgRow?.created_at ?? null },
    members,
    pendingInvites: invites,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="organization-data.json"`,
    },
  });
}
