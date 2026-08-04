import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { getProjectMetrics } from "@/lib/queries/dashboard";
import { MetricsDashboard } from "@/app/(dashboard)/projects/[id]/metrics-dashboard";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProjectMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, metrics] = await Promise.all([getProject(id), getProjectMetrics(id)]);
  if (!project) notFound();

  return (
    <div className="space-y-4 pt-4">
      {metrics.observationCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No monitoring data yet — it builds up as field observations come in.
          </CardContent>
        </Card>
      ) : (
        <MetricsDashboard cards={metrics.cards} series={metrics.series} />
      )}
    </div>
  );
}
