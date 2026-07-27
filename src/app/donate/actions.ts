"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries/profile";
import { initializeTransaction } from "@/lib/paystack";
import { PRICE_PER_TREE_KOBO } from "@/lib/donations";

export type DonateFormState = { error: string } | null;

export async function initializeDonation(
  _prevState: DonateFormState,
  formData: FormData
): Promise<DonateFormState> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?redirectTo=/donate");
  }

  const treeCount = Number(formData.get("treeCount") ?? 0);
  if (!Number.isInteger(treeCount) || treeCount < 1) {
    return { error: "Choose at least one tree to fund." };
  }

  const projectId = String(formData.get("projectId") ?? "") || null;
  const amountKobo = treeCount * PRICE_PER_TREE_KOBO;
  const reference = `eco_${crypto.randomUUID()}`;

  const supabase = await createClient();

  let organizationId: string | null = null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("organization_id")
      .eq("id", projectId)
      .maybeSingle();
    organizationId = project?.organization_id ?? null;
  }

  const { error: insertError } = await supabase.from("donations").insert({
    donor_id: profile.id,
    donor_email: profile.email,
    donor_name: profile.fullName,
    project_id: projectId,
    organization_id: organizationId,
    tree_count: treeCount,
    amount_kobo: amountKobo,
    payment_reference: reference,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  let authorizationUrl: string;
  try {
    ({ authorizationUrl } = await initializeTransaction({
      email: profile.email,
      amountKobo,
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donate/callback`,
      metadata: { treeCount, projectId },
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return { error: message };
  }

  redirect(authorizationUrl);
}
