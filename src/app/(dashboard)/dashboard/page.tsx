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
import { listProjects, RESTORATION_TYPE_LABELS } from "@/lib/queries/projects";
import {
  getOrgDashboardStats,
  getUpcomingTasks,
  listOrgActivity,
  listOrgObservationMarkers,
} from "@/lib/queries/dashboard";
import { OrgMap } from "@/components/map/org-map";
import { QuickActions } from "@/app/(dashboard)/dashboard/quick-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  monitoring: "Monitoring",
  completed: "Completed",
  archived: "Archived",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

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

  // "Last updated" per project, reusing the already-fetched activity feed
  // rather than a new query — falls back to creation date if a project
  // has no activity yet.
  const lastActivityByProject = new Map<string, string>();
  for (const event of activity) {
    const match = event.href.match(/^\/projects\/([^/]+)/);
    if (!match) continue;
    const existing = lastActivityByProject.get(match[1]);
    if (!existing || new Date(event.timestamp) > new Date(existing)) {
      lastActivityByProject.set(match[1], event.timestamp);
    }
  }
  const recentProjects = [...projects]
    .sort((a, b) => {
      const aTime = lastActivityByProject.get(a.id) ?? a.createdAt;
      const bTime = lastActivityByProject.get(b.id) ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Mission control for {profile.organizationName ?? "your organization"}&apos;s restoration programme.
        </p>
      </div>

      {/* Mobile layout — genuinely different structure, not a squeezed desktop page */}
      <div className="space-y-6 lg:hidden">
        <QuickActions projects={projects.map((p) => ({ id: p.id, name: p.name }))} />

        <div className="grid grid-cols-2 gap-3">
          {kpiCards.map((card) => (
            <Card key={card.label} className="border-border/80">
              <CardContent className="space-y-1.5 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                    <card.icon className="size-3.5 text-primary" aria-hidden="true" />
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
                <p className="text-[11px] leading-tight font-medium tracking-wide text-muted-foreground uppercase">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Restoration projects</h2>
            <Link href="/projects" className="text-xs font-medium text-primary">
              View All Projects
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No projects yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((project) => {
                const lastUpdated = lastActivityByProject.get(project.id) ?? project.createdAt;
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="border-border/80 active:bg-muted/60">
                      <CardContent className="space-y-1 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {project.name}
                          </p>
                          <Badge
                            variant={project.status === "active" ? "default" : "outline"}
                            className="shrink-0"
                          >
                            {STATUS_LABELS[project.status] ?? project.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {RESTORATION_TYPE_LABELS[project.restorationType]} · Updated{" "}
                          {relativeTime(lastUpdated)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-sm">Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing outstanding — you&apos;re caught up.</p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="block rounded-md px-2 py-2 text-sm text-foreground/90 active:bg-muted"
                >
                  {task.label}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <Link href="/activity" className="text-xs font-medium text-primary">
              View Activity
            </Link>
          </div>
          <Card className="border-border/80">
            <CardContent className="space-y-3 p-4">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.slice(0, 5).map((event) => (
                  <Link key={event.id} href={event.href} className="block text-sm">
                    <span className="block text-foreground/90">{event.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {relativeTime(event.timestamp)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-sm">Restoration projects map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full overflow-hidden rounded-lg border border-border">
              <OrgMap
                projects={projects.map((p) => ({ id: p.id, name: p.name, boundary: p.boundary }))}
                observations={observationMarkers}
                showStyleSwitcher
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop layout — unchanged */}
      <div className="hidden lg:block">
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

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
    </div>
  );
}
