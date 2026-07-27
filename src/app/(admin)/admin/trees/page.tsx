import { CheckCircle2 } from "lucide-react";
import { listTreesForReview } from "@/lib/queries/admin";
import { TreeReviewCard } from "@/app/(admin)/admin/trees/tree-review-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminTreesPage() {
  const trees = await listTreesForReview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tree review</h1>
        <p className="mt-1 text-muted-foreground">
          {trees.length} tree{trees.length === 1 ? "" : "s"} awaiting review.
        </p>
      </div>
      {trees.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Nothing to review. You&apos;re all caught up.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trees.map((tree) => (
            <TreeReviewCard key={tree.id} tree={tree} />
          ))}
        </div>
      )}
    </div>
  );
}
