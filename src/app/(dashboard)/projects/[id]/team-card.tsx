"use client";

import { useActionState } from "react";
import { AlertCircle, UserPlus, Users2, X } from "lucide-react";
import {
  inviteProjectMember,
  removeProjectMember,
  type MemberFormState,
} from "@/app/(dashboard)/projects/[id]/members-actions";
import type { ProjectMember } from "@/lib/queries/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  field_staff: "Field staff",
  verifier: "Verifier",
};

function InviteMemberDialog({ projectId }: { projectId: string }) {
  const boundAction = inviteProjectMember.bind(null, projectId);
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(
    boundAction,
    null
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <UserPlus className="size-4" aria-hidden="true" />
            Invite
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a project member</DialogTitle>
          <DialogDescription>
            Add anyone by email — existing accounts are added right away. If
            they don&apos;t have an account yet, they&apos;ll get an email to
            create one, and land on this project as soon as they do.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select name="role" defaultValue="field_staff" required>
                <SelectTrigger id="invite-role" className="w-full">
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
              <Label htmlFor="invite-title">Title (optional)</Label>
              <Input id="invite-title" name="title" placeholder="GPS Surveyor" />
            </div>
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
              {pending ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMemberButton({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const boundAction = removeProjectMember.bind(null, projectId, userId);
  const [, formAction, pending] = useActionState<MemberFormState, FormData>(
    boundAction,
    null
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        aria-label="Remove from project"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </form>
  );
}

export function TeamCard({
  projectId,
  members,
  canManage,
}: {
  projectId: string;
  members: ProjectMember[];
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Users2 className="size-4 text-muted-foreground" aria-hidden="true" />
          Team
        </CardTitle>
        {canManage && <InviteMemberDialog projectId={projectId} />}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {members.length === 0 ? (
          <p className="text-muted-foreground">
            No members assigned beyond org admins and field staff.
          </p>
        ) : (
          members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate">{member.fullName || "Invited — pending sign-up"}</p>
                {member.title && (
                  <p className="truncate text-xs text-muted-foreground">{member.title}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  {ROLE_LABELS[member.role] ?? member.role}
                </Badge>
                {canManage && (
                  <RemoveMemberButton projectId={projectId} userId={member.userId} />
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
