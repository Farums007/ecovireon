import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/lib/queries/projects";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import { getCurrentProfile } from "@/lib/queries/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectFundingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, profile] = await Promise.all([getProject(id), getCurrentProfile()]);
  if (!project) notFound();

  const isOwnerOrgAdmin =
    profile?.role === "admin" && profile.organizationId === project.organizationId;

  return (
    <div className="max-w-xl space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Funding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Funding source
            </p>
            <p className="mt-0.5 text-foreground">{project.fundingSource || "Not set"}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Budget</p>
            <p className="mt-0.5 text-foreground">
              {project.budget !== null
                ? `${CURRENCY_SYMBOLS[project.currency]}${project.budget.toLocaleString()}`
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Expected outcomes
            </p>
            <p className="mt-0.5 text-foreground">{project.expectedOutcomes || "Not set"}</p>
          </div>
        </CardContent>
      </Card>
      {isOwnerOrgAdmin && (
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          render={<Link href={`/projects/${id}/edit`}>Edit funding details</Link>}
        />
      )}
    </div>
  );
}
