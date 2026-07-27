"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { AlertCircle, MapPin, ShieldX } from "lucide-react";
import {
  approveTreeAction,
  rejectTreeAction,
  type ModerationState,
} from "@/app/(admin)/admin/trees/actions";
import { getTreePhotoUrl } from "@/lib/storage-urls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export function TreeReviewCard({
  tree,
}: {
  tree: {
    id: string;
    species: string;
    status: string;
    photoPath: string;
    observedAt: string;
    gpsAccuracyM: number | null;
    ownerName: string;
  };
}) {
  const [approveState, approveAction, approvePending] = useActionState<
    ModerationState,
    FormData
  >(approveTreeAction, null);
  const [rejectState, rejectAction, rejectPending] = useActionState<
    ModerationState,
    FormData
  >(rejectTreeAction, null);
  const [reason, setReason] = useState("");

  const approveSubmitted = useRef(false);
  useEffect(() => {
    if (approvePending) approveSubmitted.current = true;
    else if (approveSubmitted.current && !approveState?.error) {
      toast.success(`${tree.species} approved`);
      approveSubmitted.current = false;
    }
  }, [approvePending, approveState, tree.species]);

  const rejectSubmitted = useRef(false);
  useEffect(() => {
    if (rejectPending) rejectSubmitted.current = true;
    else if (rejectSubmitted.current && !rejectState?.error) {
      toast.success(`${tree.species} rejected`);
      rejectSubmitted.current = false;
    }
  }, [rejectPending, rejectState, tree.species]);

  return (
    <Card className="overflow-hidden border-border/80">
      <div className="relative h-40 w-full">
        <Image
          src={getTreePhotoUrl(tree.photoPath)}
          alt={tree.species}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{tree.species}</CardTitle>
          <Badge variant={tree.status === "flagged" ? "destructive" : "outline"} className="capitalize">
            {tree.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {tree.ownerName} · {new Date(tree.observedAt).toLocaleDateString()}
          {tree.gpsAccuracyM ? ` · ±${Math.round(tree.gpsAccuracyM)}m` : ""}
        </p>

        <form action={approveAction}>
          <input type="hidden" name="treeId" value={tree.id} />
          <Button type="submit" size="sm" className="w-full" disabled={approvePending}>
            {approvePending ? "Approving..." : "Approve"}
          </Button>
        </form>
        {approveState?.error && (
          <p className="text-xs text-destructive" role="alert">
            {approveState.error}
          </p>
        )}

        <Dialog>
          <DialogTrigger
            render={
              <Button type="button" size="sm" variant="outline" className="w-full">
                <ShieldX className="size-4" aria-hidden="true" />
                Reject
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject this tree?</DialogTitle>
              <DialogDescription>
                {tree.species} logged by {tree.ownerName} won&apos;t be
                verified or shown publicly. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <form action={rejectAction} className="space-y-3">
              <input type="hidden" name="treeId" value={tree.id} />
              <div className="space-y-1.5">
                <Label htmlFor={`reason-${tree.id}`}>Reason</Label>
                <Input
                  id={`reason-${tree.id}`}
                  name="reason"
                  placeholder="e.g. duplicate submission, unclear photo"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {rejectState?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>{rejectState.error}</span>
                </div>
              )}
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" variant="destructive" disabled={rejectPending}>
                  {rejectPending ? "Rejecting..." : "Reject tree"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
