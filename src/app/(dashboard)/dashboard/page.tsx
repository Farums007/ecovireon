import Link from "next/link";
import {
  BarChart3,
  Cloud,
  Globe2,
  History,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects } from "@/lib/queries/projects";
import {
  getOrgDashboardStats,
  getUpcomingTasks,
  listOrgActivity,
  listOrgObservationMarkers,
} from "@/lib/queries/dashboard";
import { OrgMap } from "@/components/map/org-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrgDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const [projects, stats, activity, tasks, observationMarkers] = await Promise.all([
    listProjects(profile.organizationId),
    getOrgDashboardStats(profile.organizationId),
    listOrgActivity(profile.organizationId, 8),
    getUpcomingTasks(profile.organizationId),
    listOrgObservationMarkers(),
  ]);

  const kpiCards = [
    { label: "Active Projects", value: stats.activeProjects, icon: Globe2 },
    { label: "Area Under Restoration", value: `${stats.areaRestoredHa.toFixed(1)} ha`, icon: Ruler },
    { label: "Restoration Assets", value: stats.restorationAssetsCount, icon: BarChart3 },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: ShieldCheck },
    { label: "Upcoming Monitoring", value: stats.upcomingMonitoringCount, icon: History },
    { label: "Estimated Carbon Impact", value: `${stats.estimatedCarbonKg.toLocaleString()} kg`, icon: Cloud },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Mission control for {profile.organizationName ?? "your organization"}&apos;s restoration programme.
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
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full border-border/80">
            <CardHeader>
              <CardTitle className="text-sm">Restoration projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full overflow-hidden rounded-lg border border-border">
                <OrgMap
                  projects={projects.map((p) => ({ id: p.id, name: p.name, boundary: p.boundary }))}
                  observations={observationMarkers}
                  showStyleSwitcher
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-sm">Upcoming tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing outstanding — you&apos;re caught up.</p>
              ) : (
                tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={task.href}
                    className="block rounded-md px-2 py-1.5 text-sm text-foreground/90 transition-colors hover:bg-muted"
                  >
                    {task.label}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-sm">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="block text-sm text-foreground/90 transition-colors hover:text-primary"
                  >
                    <span className="block">{event.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
