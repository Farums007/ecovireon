"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, ShieldX } from "lucide-react";
import {
  setVerificationStatusAction,
  type VerificationActionState,
} from "@/app/(dashboard)/projects/[id]/verification-actions";
import type { FieldObservation } from "@/lib/queries/observations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ActionButton({
  observationId,
  projectId,
  status,
  label,
  icon: Icon,
  variant = "outline",
}: {
  observationId: string;
  projectId: string;
  status: "verified" | "needs_review";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "outline";
}) {
  const boundAction = setVerificationStatusAction.bind(null, observationId, projectId, status);
  const [state, formAction, pending] = useActionState<VerificationActionState, FormData>(
    boundAction,
    null
  );

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        <Icon className="size-4" aria-hidden="true" />
        {pending ? "Saving..." : label}
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

function RejectButton({ observationId, projectId }: { observationId: string; projectId: string }) {
  const boundAction = setVerificationStatusAction.bind(null, observationId, projectId, "rejected");
  const [state, formAction, pending] = useActionState<VerificationActionState, FormData>(
    boundAction,
    null
  );
  const [comment, setComment] = useState("");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" size="sm" variant="outline">
            <ShieldX className="size-4" aria-hidden="true" />
            Reject
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this observation?</DialogTitle>
          <DialogDescription>
            It won&apos;t count as a verified Restoration Asset. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`comment-${observationId}`}>Comment</Label>
            <Input
              id={`comment-${observationId}`}
              name="comment"
              placeholder="e.g. GPS accuracy too low, unclear photo"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VerificationCard({
  observation,
  projectId,
  projectName,
}: {
  observation: FieldObservation;
  projectId: string;
  projectName?: string;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {new Date(observation.observedAt).toLocaleString()}
        </CardTitle>
        {projectName && <p className="text-xs text-muted-foreground">{projectName}</p>}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {Object.entries(observation.metrics).length > 0 && (
          <ul className="space-y-1 text-muted-foreground">
            {Object.entries(observation.metrics).map(([key, value]) => (
              <li key={key}>
                <span className="font-medium text-foreground">{key}:</span> {value}
              </li>
            ))}
          </ul>
        )}
        {observation.notes && <p>{observation.notes}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <ActionButton
            observationId={observation.id}
            projectId={projectId}
            status="verified"
            label="Verify"
            icon={CheckCircle2}
            variant="default"
          />
          <ActionButton
            observationId={observation.id}
            projectId={projectId}
            status="needs_review"
            label="Needs review"
            icon={Eye}
          />
          <RejectButton observationId={observation.id} projectId={projectId} />
        </div>
      </CardContent>
    </Card>
  );
}
