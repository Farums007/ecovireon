"use client";

import { useActionState } from "react";
import { AlertCircle, Ban, ShieldCheck, Trash2 } from "lucide-react";
import {
  setUserBanned,
  deleteUser,
  type UserActionState,
} from "@/app/(admin)/admin/users/actions";
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

function BanToggleButton({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const boundAction = setUserBanned.bind(null, userId, !isBanned);
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    boundAction,
    null
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {isBanned ? (
          <>
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {pending ? "Unbanning..." : "Unban"}
          </>
        ) : (
          <>
            <Ban className="size-3.5" aria-hidden="true" />
            {pending ? "Banning..." : "Ban"}
          </>
        )}
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const boundAction = deleteUser.bind(null, userId);
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    boundAction,
    null
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {userName || "this account"}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the account and its login. It only
            succeeds if the account has no trees, donations, or other
            records attached — otherwise, ban it instead.
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
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserRowActions({
  userId,
  userName,
  isBanned,
}: {
  userId: string;
  userName: string;
  isBanned: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <BanToggleButton userId={userId} isBanned={isBanned} />
      <DeleteUserButton userId={userId} userName={userName} />
    </div>
  );
}
