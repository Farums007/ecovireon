import Link from "next/link";
import { TreePine, Wallet } from "lucide-react";
import { listAllDonations } from "@/lib/queries/admin";
import { formatNaira } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDonationsPage() {
  const donations = await listAllDonations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Donations</h1>
        <p className="mt-1 text-muted-foreground">
          Paid donations still owed trees need fulfilling.
        </p>
      </div>
      {donations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Wallet className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No donations yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => {
            const owed = donation.treeCount - donation.treesFulfilled;
            return (
              <Card key={donation.id} className="border-border/80">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(donation.donorName || donation.donorEmail).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {donation.donorName || donation.donorEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(donation.amountKobo)} · {donation.treeCount}{" "}
                        tree{donation.treeCount === 1 ? "" : "s"} ·{" "}
                        {donation.treesFulfilled} fulfilled ·{" "}
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={donation.status === "paid" ? "default" : "outline"} className="capitalize">
                      {donation.status}
                    </Badge>
                    {donation.status === "paid" && owed > 0 && (
                      <Button
                        nativeButton={false}
                        size="sm"
                        render={
                          <Link href={`/admin/donations/${donation.id}/fulfill`}>
                            <TreePine className="size-4" aria-hidden="true" />
                            Log a tree
                          </Link>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
