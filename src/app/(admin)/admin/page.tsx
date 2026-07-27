import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  TreePine,
  Users2,
  UserRound,
  Wallet,
} from "lucide-react";
import { getAdminStats } from "@/lib/queries/admin";
import { formatNaira } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Trees pending review",
      value: stats.pendingTrees,
      icon: Clock,
      href: "/admin/trees",
      attention: stats.pendingTrees > 0,
    },
    {
      label: "Trees flagged for fraud",
      value: stats.flaggedTrees,
      icon: AlertTriangle,
      href: "/admin/trees",
      attention: stats.flaggedTrees > 0,
    },
    { label: "Verified trees", value: stats.approvedTrees, icon: CheckCircle2, href: "/admin/trees" },
    { label: "Total trees logged", value: stats.totalTrees, icon: TreePine, href: "/admin/trees" },
    { label: "Total users", value: stats.totalUsers, icon: Users2, href: "/admin/users" },
    { label: "Individual users", value: stats.individualUsers, icon: UserRound, href: "/admin/users" },
    { label: "Organizations", value: stats.organizationCount, icon: Building2, href: "/admin/users" },
    {
      label: "Total donated",
      value: formatNaira(stats.totalDonatedKobo),
      icon: Wallet,
      href: "/admin/donations",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">Platform-wide snapshot.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Card
              className={`h-full border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                card.attention ? "border-amber-300 bg-amber-50" : ""
              }`}
            >
              <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {card.label}
                </CardTitle>
                <div
                  className={`flex size-8 items-center justify-center rounded-full ${
                    card.attention ? "bg-amber-200/70" : "bg-primary/10"
                  }`}
                >
                  <card.icon
                    className={`size-4 ${card.attention ? "text-amber-700" : "text-primary"}`}
                    aria-hidden="true"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
