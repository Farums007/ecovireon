import { notFound } from "next/navigation";
import { BarChart3, CheckCircle2, Ruler, Sprout } from "lucide-react";
import { getProject } from "@/lib/queries/projects";
import { listObservations } from "@/lib/queries/observations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectImpactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, observations] = await Promise.all([getProject(id), listObservations(id)]);
  if (!project) notFound();

  const verifiedCount = observations.filter((o) => o.verificationStatus === "verified").length;
  const decidedCount = observations.filter((o) => o.verificationStatus !== "pending").length;
  const verificationRate = decidedCount > 0 ? Math.round((verifiedCount / decidedCount) * 100) : 0;

  const cards = [
    { label: "Area Restored", value: project.areaHa ? `${project.areaHa.toFixed(1)} ha` : "—", icon: Ruler },
    { label: "Restoration Assets", value: verifiedCount, icon: Sprout },
    { label: "Verification Rate", value: `${verificationRate}%`, icon: CheckCircle2 },
    { label: "Monitoring Coverage", value: observations.length, icon: BarChart3 },
  ];

  return (
    <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
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
  );
}
