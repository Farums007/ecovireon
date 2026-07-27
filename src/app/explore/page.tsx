import type { Metadata } from "next";
import { listPublicProjects } from "@/lib/queries/projects";
import { listApprovedTrees } from "@/lib/queries/trees";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ExploreMap } from "@/components/map/explore-map";

export const metadata: Metadata = {
  title: "Explore the map",
  description: "Verified trees and restoration project sites, worldwide.",
};

export default async function ExplorePage() {
  const [projects, trees] = await Promise.all([
    listPublicProjects(),
    listApprovedTrees(),
  ]);

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Explore the map
          </h1>
          <p className="mt-1 text-muted-foreground">
            {trees.length} verified {trees.length === 1 ? "tree" : "trees"}{" "}
            and {projects.length} public restoration{" "}
            {projects.length === 1 ? "site" : "sites"}. Click an orange pin
            for a tree&apos;s story.
          </p>
        </div>
        <div className="h-[calc(100vh-14rem)] min-h-96 w-full overflow-hidden rounded-xl border border-border shadow-sm">
          <ExploreMap
            projects={projects.map((p) => ({ id: p.id, boundary: p.boundary }))}
            trees={trees
              .filter((t) => t.location)
              .map((t) => ({ id: t.id, location: t.location! }))}
          />
        </div>
      </main>
    </div>
  );
}
