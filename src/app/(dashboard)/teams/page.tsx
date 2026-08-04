import { getCurrentProfile } from "@/lib/queries/profile";
import { listOrgMembers, listPendingOrgInvites } from "@/lib/queries/teams";
import { InviteDialog } from "@/app/(dashboard)/teams/invite-dialog";
import { MemberRowActions } from "@/app/(dashboard)/teams/member-row-actions";
import { CancelInviteButton } from "@/app/(dashboard)/teams/cancel-invite-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  field_staff: "Field staff",
  verifier: "Verifier",
};

export default async function TeamsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const [members, invites] = await Promise.all([
    listOrgMembers(profile.organizationId),
    listPendingOrgInvites(profile.organizationId),
  ]);

  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="mt-1 text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"} in {profile.organizationName}.
          </p>
        </div>
        {isAdmin && <InviteDialog />}
      </div>

      <Card className="border-border/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">
                    {member.fullName || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[member.role] ?? member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.title || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <MemberRowActions member={member} currentUserId={profile.id} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAdmin && invites.length > 0 && (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-sm">Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium text-foreground">{invite.email}</span>{" "}
                  <span className="text-muted-foreground">
                    · {ROLE_LABELS[invite.role] ?? invite.role}
                  </span>
                </div>
                <CancelInviteButton inviteId={invite.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
