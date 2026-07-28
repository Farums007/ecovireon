"use client";

import { useActionState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import {
  deleteProject,
  type DeleteProjectState,
} from "@/app/(dashboard)/projects/actions";
import { Button } from "@/components/ui/button";
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

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const boundAction = deleteProject.bind(null, projectId);
  const [state, formAction, pending] = useActionState<
    DeleteProjectState,
    FormData
  >(boundAction, null);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {projectName}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the project, its site boundary, team
            assignments, field observations, and monitoring sites. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          {state?.error && (
            <div
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
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
              {pending ? "Deleting..." : "Delete project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
