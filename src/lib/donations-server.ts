import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function markDonationPaid(reference: string, amountKobo: number) {
  const supabase = createServiceRoleClient();

  const { data: donation, error: fetchError } = await supabase
    .from("donations")
    .select("id, donor_id, status")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (fetchError || !donation) return null;
  if (donation.status === "paid") return donation;

  const { error: updateError } = await supabase
    .from("donations")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", donation.id);

  if (updateError) throw new Error(updateError.message);

  if (donation.donor_id) {
    await supabase.rpc("increment_donations_total", {
      p_profile_id: donation.donor_id,
      p_amount_kobo: amountKobo,
    });
  }

  return donation;
}
