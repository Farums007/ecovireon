import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDonation } from "@/lib/queries/admin";
import { formatNaira } from "@/lib/format";
import { FulfillForm } from "@/app/(admin)/admin/donations/[id]/fulfill/fulfill-form";

export default async function FulfillDonationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donation = await getDonation(id);
  if (!donation) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/admin/donations"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to donations
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Log a tree for {donation.donorName || donation.donorEmail}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {formatNaira(donation.amountKobo)} · {donation.treesFulfilled}/
          {donation.treeCount} trees logged so far.
        </p>
      </div>
      <FulfillForm donationId={donation.id} />
    </div>
  );
}
