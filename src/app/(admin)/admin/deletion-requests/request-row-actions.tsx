"use client";

import { useActionState, useState } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import {
  approveIndividualDeletionAction,
  approveOrganizationDeletionAction,
  resolveDeletionRequestAction,
  type DeletionRequestActionState,
} from "@/app/(admin)/admin/deletion-requests/actions";
import type { AdminDeletionRequest } from "@/lib/queries/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const APPROVE_EXPLANATION: Record<AdminDeletionRequest["type"], string> = {
  organization:
    "This deletes the organization: every team member is converted to an individual account (they keep their login, they just lose access to this org), and its projects, boundaries, and field data are deleted. Donations and trees tied to this org are kept but unlinked from it. This can't be undone.",
  individual:
    "This deletes their login — they won't be able to sign back in. Trees they planted, donations they made, and reports they generated stay in the system, but are no longer attributed to them. This can't be undone.",
};

function ApproveDialog({ request }: { request: AdminDeletionRequest }) {
  const [confirmText, setConfirmText] = useState("");
  const boundAction =
    request.type === "organization"
      ? approveOrganizationDeletionAction.bind(null, request.id)
      : approveIndividualDeletionAction.bind(null, request.id, request.targetName);
  const [state, formAction, pending] = useActionState<DeletionRequestActionState, FormData>(
    boundAction,
    null
  );

  const matches = confirmText.trim() === request.targetName;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm">
            Approve &amp; delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {request.targetName}?</DialogTitle>
          <DialogDescription>{APPROVE_EXPLANATION[request.type]}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`confirm-${request.id}`}>
              Type <span className="font-semibold text-foreground">{request.targetName}</span> to
              confirm
            </Label>
            <Input
              id={`confirm-${request.id}`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
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
            <Button type="submit" variant="destructive" disabled={!matches || pending}>
              {pending ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RequestRowActions({ request }: { request: AdminDeletionRequest }) {
  const boundCancel = resolveDeletionRequestAction.bind(null, request.id, "cancelled");
  const [cancelState, cancelAction, cancelPending] = useActionState<
    DeletionRequestActionState,
    FormData
  >(boundCancel, null);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end gap-2">
        <form action={cancelAction}>
          <Button type="submit" variant="outline" size="sm" disabled={cancelPending}>
            {cancelPending ? "..." : "Cancel request"}
          </Button>
        </form>
        <ApproveDialog request={request} />
      </div>
      {cancelState?.error && (
        <div
          role="alert"
          className="flex items-start justify-end gap-1.5 text-right text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{cancelState.error}</span>
        </div>
      )}
    </div>
  );
}
