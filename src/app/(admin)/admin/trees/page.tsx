import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { listTreesForReview, type TreeStatusFilter } from "@/lib/queries/admin";
import { TreeReviewCard } from "@/app/(admin)/admin/trees/tree-review-card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FILTERS: { value: TreeStatusFilter; label: string }[] = [
  { value: "review", label: "Needs review" },
  { value: "approved", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const ALL_STATUSES: TreeStatusFilter[] = [
  "review",
  "pending",
  "flagged",
  "approved",
  "rejected",
  "all",
];

const EMPTY_MESSAGE: Record<TreeStatusFilter, string> = {
  review: "Nothing to review. You're all caught up.",
  pending: "No trees pending review.",
  flagged: "No trees flagged for fraud.",
  approved: "No verified trees yet.",
  rejected: "No rejected trees.",
  all: "No trees logged yet.",
};

export default async function AdminTreesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter: TreeStatusFilter = ALL_STATUSES.includes(status as TreeStatusFilter)
    ? (status as TreeStatusFilter)
    : "review";

  const trees = await listTreesForReview(filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tree review</h1>
        <p className="mt-1 text-muted-foreground">
          {trees.length} tree{trees.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter trees">
        {FILTERS.map((f) => {
          const selected =
            filter === f.value ||
            (f.value === "review" && (filter === "pending" || filter === "flagged"));
          return (
            <Link
              key={f.value}
              href={f.value === "review" ? "/admin/trees" : `/admin/trees?status=${f.value}`}
              role="tab"
              aria-selected={selected}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                selected
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {trees.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{EMPTY_MESSAGE[filter]}</p>
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
