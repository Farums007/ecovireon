import { BarChart3, Cloud, Globe2, History, Ruler, ShieldCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects, RESTORATION_TYPE_LABELS } from "@/lib/queries/projects";
import { getOrgDashboardStats } from "@/lib/queries/dashboard";
import { listOrgObservationsByStatus } from "@/lib/queries/observations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ImpactPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const [projects, stats] = await Promise.all([
    listProjects(profile.organizationId),
    getOrgDashboardStats(profile.organizationId),
  ]);
  const verifiedAssets = await listOrgObservationsByStatus(
    projects.map((p) => p.id),
    ["verified"]
  );

  const assetCountByProject = new Map<string, number>();
  for (const asset of verifiedAssets) {
    assetCountByProject.set(asset.projectId, (assetCountByProject.get(asset.projectId) ?? 0) + 1);
  }

  const decidedCount = stats.restorationAssetsCount + stats.pendingVerifications;
  const verificationRate =
    decidedCount > 0 ? Math.round((stats.restorationAssetsCount / decidedCount) * 100) : 0;

  const kpiCards = [
    { label: "Active Projects", value: stats.activeProjects, icon: Globe2 },
    { label: "Area Restored", value: `${stats.areaRestoredHa.toFixed(1)} ha`, icon: Ruler },
    { label: "Restoration Assets", value: stats.restorationAssetsCount, icon: BarChart3 },
    { label: "Verification Rate", value: `${verificationRate}%`, icon: ShieldCheck },
    {
      label: "Monitoring Coverage",
      value: stats.upcomingMonitoringCount === 0 ? "Up to date" : `${stats.upcomingMonitoringCount} overdue`,
      icon: History,
    },
    { label: "Estimated Carbon Impact", value: `${stats.estimatedCarbonKg.toLocaleString()} kg`, icon: Cloud },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Impact & Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Executive rollup across every project in {profile.organizationName}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <Card key={card.label} className="border-border/80">
            <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {card.label}
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <card.icon className="size-4 text-primary" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">By project</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Restoration type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Assets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {RESTORATION_TYPE_LABELS[project.restorationType]}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.areaHa ? `${project.areaHa.toFixed(1)} ha` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assetCountByProject.get(project.id) ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
