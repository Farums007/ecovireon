"use client";

import { useActionState } from "react";
import { X } from "lucide-react";
import { cancelInviteAction, type TeamActionState } from "@/app/(dashboard)/teams/actions";

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const boundAction = cancelInviteAction.bind(null, inviteId);
  const [, formAction, pending] = useActionState<TeamActionState, FormData>(boundAction, null);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        aria-label="Cancel invite"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </form>
  );
}
