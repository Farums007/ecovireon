"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, Download } from "lucide-react";
import {
  requestIndividualDeletionAction,
  type SettingsActionState,
} from "@/app/(account)/account/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function DataPrivacy({ pendingRequest }: { pendingRequest: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    requestIndividualDeletionAction,
    null
  );

  const submitted = useRef(false);
  useEffect(() => {
    if (pending) {
      submitted.current = true;
      return;
    }
    if (submitted.current && state && "success" in state) {
      toast.success("Deletion request submitted");
      setOpen(false);
    }
    submitted.current = false;
  }, [pending, state]);

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a href="/api/export/my-data" download>
            <Download className="size-4" aria-hidden="true" />
            Export my data
          </a>
        }
      />

      <div className="border-t border-border pt-4">
        {pendingRequest ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Your account deletion request is pending review. We&apos;ll follow up by email.</span>
          </div>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" size="sm" className="text-destructive">
                  Request account deletion
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request account deletion</DialogTitle>
                <DialogDescription>
                  This logs a request for our team to review — nothing is deleted
                  automatically. We&apos;ll follow up by email before removing any data.
                </DialogDescription>
              </DialogHeader>
              <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea id="reason" name="reason" rows={3} />
                </div>
                {state && "error" in state && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>{state.error}</span>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" />}>
                    Cancel
                  </DialogClose>
                  <Button type="submit" variant="destructive" disabled={pending}>
                    {pending ? "Submitting..." : "Submit request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
