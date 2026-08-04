import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listMyTrees } from "@/lib/queries/trees";
import { listMyOrgMemberships } from "@/lib/queries/teams";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const supabase = await createClient();
  const [trees, memberships, donationsResult] = await Promise.all([
    listMyTrees(),
    listMyOrgMemberships(),
    supabase
      .from("donations")
      .select(
        "id, tree_count, amount_kobo, currency, status, created_at, paid_at"
      )
      .eq("donor_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      region: profile.region,
      treesPlantedCount: profile.treesPlantedCount,
      co2EstimatedKg: profile.co2EstimatedKg,
      donationsTotalKobo: profile.donationsTotalKobo,
    },
    organizationMemberships: memberships,
    trees,
    donations: donationsResult.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="my-data.json"`,
    },
  });
}
