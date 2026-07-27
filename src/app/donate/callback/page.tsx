import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { verifyTransaction } from "@/lib/paystack";
import { markDonationPaid } from "@/lib/donations-server";
import { formatNaira } from "@/lib/format";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Donation status",
  robots: { index: false },
};

export default async function DonateCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  let outcome: "success" | "failed" | "unknown" = "unknown";
  let amountKobo = 0;

  if (reference) {
    try {
      const result = await verifyTransaction(reference);
      amountKobo = result.amountKobo;
      if (result.status === "success") {
        await markDonationPaid(reference, result.amountKobo);
        outcome = "success";
      } else {
        outcome = "failed";
      }
    } catch {
      outcome = "unknown";
    }
  }

  const ICONS = {
    success: { Icon: CheckCircle2, className: "text-primary bg-primary/10" },
    failed: { Icon: XCircle, className: "text-destructive bg-destructive/10" },
    unknown: { Icon: AlertTriangle, className: "text-amber-600 bg-amber-100" },
  } as const;
  const { Icon, className } = ICONS[outcome];

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="mx-auto flex max-w-xl flex-1 items-center px-4 py-16 sm:px-6 sm:py-20">
        <Card className="w-full shadow-lg shadow-black/5">
          <CardHeader className="items-center text-center">
            <div className={`flex size-14 items-center justify-center rounded-full ${className}`}>
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <CardTitle className="pt-3 text-xl">
              {outcome === "success"
                ? "Thank you — your donation is confirmed"
                : outcome === "failed"
                  ? "Payment wasn't completed"
                  : "We couldn't confirm this payment yet"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-center text-sm text-muted-foreground">
            {outcome === "success" && (
              <p>
                {formatNaira(amountKobo)} received. An organization will plant
                and verify your tree, and it&apos;ll show up on your profile
                with a photo, GPS location, and progress updates.
              </p>
            )}
            {outcome === "failed" && (
              <p>The payment didn&apos;t go through. No charge was made.</p>
            )}
            {outcome === "unknown" && (
              <p>
                If you completed checkout, it may still be processing —
                check your email or your profile in a few minutes.
              </p>
            )}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                render={<Link href="/account">Go to your profile</Link>}
              />
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/donate">Back to donate</Link>}
              />
            </div>
          </CardContent>
        </Card>
      </main>
      <MarketingFooter />
    </div>
  );
}
