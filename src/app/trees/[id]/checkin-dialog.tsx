"use client";

import { useActionState } from "react";
import { AlertCircle, Sprout } from "lucide-react";
import { addTreeCheckin, type CheckinFormState } from "@/app/trees/[id]/checkin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function CheckinDialog({ treeId }: { treeId: string }) {
  const boundAction = addTreeCheckin.bind(null, treeId);
  const [state, formAction, pending] = useActionState<CheckinFormState, FormData>(
    boundAction,
    null
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" size="sm">
            <Sprout className="size-4" aria-hidden="true" />
            Check in
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check in on this tree</DialogTitle>
          <DialogDescription>
            Add a progress update — a new photo and a note about how it&apos;s
            growing. It&apos;ll show up on the growth timeline.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin-photo">Photo</Label>
            <Input id="checkin-photo" name="photo" type="file" accept="image/*" capture="environment" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-height">Height / size (optional)</Label>
            <Input id="checkin-height" name="heightNote" placeholder="e.g. 1.2m" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-notes">Notes</Label>
            <Textarea id="checkin-notes" name="notes" rows={3} placeholder="How's it doing?" />
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
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save check-in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
