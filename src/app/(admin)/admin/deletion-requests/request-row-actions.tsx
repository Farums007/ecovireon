"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import {
  resolveDeletionRequestAction,
  type DeletionRequestActionState,
} from "@/app/(admin)/admin/deletion-requests/actions";
import { Button } from "@/components/ui/button";

export function RequestRowActions({ requestId }: { requestId: string }) {
  const boundComplete = resolveDeletionRequestAction.bind(null, requestId, "completed");
  const [completeState, completeAction, completePending] = useActionState<
    DeletionRequestActionState,
    FormData
  >(boundComplete, null);

  const boundCancel = resolveDeletionRequestAction.bind(null, requestId, "cancelled");
  const [cancelState, cancelAction, cancelPending] = useActionState<
    DeletionRequestActionState,
    FormData
  >(boundCancel, null);

  const error =
    (completeState && "error" in completeState && completeState.error) ||
    (cancelState && "error" in cancelState && cancelState.error) ||
    null;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end gap-2">
        <form action={cancelAction}>
          <Button type="submit" variant="outline" size="sm" disabled={cancelPending}>
            {cancelPending ? "..." : "Cancel request"}
          </Button>
        </form>
        <form action={completeAction}>
          <Button type="submit" size="sm" disabled={completePending}>
            {completePending ? "..." : "Mark completed"}
          </Button>
        </form>
      </div>
      {error && (
        <div
          role="alert"
          className="flex items-start justify-end gap-1.5 text-right text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
