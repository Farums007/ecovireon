import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  listDeletionRequests,
  type DeletionRequestStatus,
} from "@/lib/queries/admin";
import { RequestRowActions } from "@/app/(admin)/admin/deletion-requests/request-row-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Filter = DeletionRequestStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const TYPE_LABELS: Record<string, string> = {
  organization: "Organization",
  individual: "Individual",
};

const STATUS_VARIANTS: Record<DeletionRequestStatus, "default" | "secondary" | "outline"> = {
  pending: "default",
  completed: "secondary",
  cancelled: "outline",
};

export default async function AdminDeletionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.value === status)
    ? (status as Filter)
    : "pending";

  const requests = await listDeletionRequests(filter === "all" ? undefined : filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deletion requests</h1>
        <p className="mt-1 text-muted-foreground">
          {requests.length} request{requests.length === 1 ? "" : "s"}. Nothing is deleted
          automatically — review each one and follow up directly with the requester.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter requests">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "pending" ? "/admin/deletion-requests" : `/admin/deletion-requests?status=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              filter === f.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {filter === "pending" ? "No pending requests. You're all caught up." : "No requests here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  {filter === "pending" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Badge variant="outline">{TYPE_LABELS[request.type] ?? request.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {request.targetName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.requestedByName}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {request.reason || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[request.status]}>{request.status}</Badge>
                    </TableCell>
                    {filter === "pending" && (
                      <TableCell>
                        <RequestRowActions request={request} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
