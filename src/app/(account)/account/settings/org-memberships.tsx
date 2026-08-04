"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import {
  acceptInviteAction,
  declineInviteAction,
  switchOrganizationAction,
  type SettingsActionState,
} from "@/app/(account)/account/settings/actions";
import type { MyOrgMembership, MyPendingInvite } from "@/lib/queries/teams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  field_staff: "Field staff",
  verifier: "Verifier",
};

function InviteRow({ invite }: { invite: MyPendingInvite }) {
  const boundAccept = acceptInviteAction.bind(null, invite.id);
  const [acceptState, acceptFormAction, acceptPending] = useActionState<
    SettingsActionState,
    FormData
  >(boundAccept, null);

  const boundDecline = declineInviteAction.bind(null, invite.id);
  const [declineState, declineFormAction, declinePending] = useActionState<
    SettingsActionState,
    FormData
  >(boundDecline, null);

  const error =
    (acceptState && "error" in acceptState && acceptState.error) ||
    (declineState && "error" in declineState && declineState.error) ||
    null;

  return (
    <div className="space-y-1.5 rounded-lg border border-border/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{invite.organizationName}</p>
          <p className="text-xs text-muted-foreground">
            Invited as {ROLE_LABELS[invite.role] ?? invite.role}
            {invite.invitedByName ? ` by ${invite.invitedByName}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={declineFormAction}>
            <Button type="submit" variant="outline" size="sm" disabled={declinePending}>
              {declinePending ? "..." : "Decline"}
            </Button>
          </form>
          <form action={acceptFormAction}>
            <Button type="submit" size="sm" disabled={acceptPending}>
              {acceptPending ? "..." : "Accept"}
            </Button>
          </form>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function MembershipRow({
  membership,
  isActive,
}: {
  membership: MyOrgMembership;
  isActive: boolean;
}) {
  const boundSwitch = switchOrganizationAction.bind(null, membership.organizationId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{membership.organizationName}</p>
        <p className="text-xs text-muted-foreground">
          {ROLE_LABELS[membership.role] ?? membership.role}
          {membership.title ? ` · ${membership.title}` : ""}
        </p>
      </div>
      {isActive ? (
        <Badge>Active</Badge>
      ) : (
        <form action={boundSwitch}>
          <Button type="submit" variant="outline" size="sm">
            Switch to this workspace
          </Button>
        </form>
      )}
    </div>
  );
}

export function OrgMemberships({
  memberships,
  pendingInvites,
  activeOrganizationId,
}: {
  memberships: MyOrgMembership[];
  pendingInvites: MyPendingInvite[];
  activeOrganizationId: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t belong to any organizations yet.
          </p>
        ) : (
          memberships.map((membership) => (
            <MembershipRow
              key={membership.organizationId}
              membership={membership}
              isActive={membership.organizationId === activeOrganizationId}
            />
          ))
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Pending invitations</p>
          {pendingInvites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </div>
  );
}
