"use client";

import { useActionState } from "react";
import { AlertCircle, Pencil } from "lucide-react";
import { updateMemberAction, type TeamActionState } from "@/app/(dashboard)/teams/actions";
import type { OrgMember } from "@/lib/queries/teams";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MemberRowActions({ member }: { member: OrgMember }) {
  const boundAction = updateMemberAction.bind(null, member.id);
  const [state, formAction, pending] = useActionState<TeamActionState, FormData>(
    boundAction,
    null
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {member.fullName || "member"}</DialogTitle>
          <DialogDescription>
            Role controls what they can do; title is just a label shown on the team page.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`role-${member.id}`}>Role</Label>
            <Select name="role" defaultValue={member.role} required>
              <SelectTrigger id={`role-${member.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="field_staff">Field staff</SelectItem>
                <SelectItem value="verifier">Verifier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`title-${member.id}`}>Title (optional)</Label>
            <Input
              id={`title-${member.id}`}
              name="title"
              placeholder="e.g. Programme Manager"
              defaultValue={member.title ?? ""}
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
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
