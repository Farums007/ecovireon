import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listMyOrgMemberships, listMyPendingInvites } from "@/lib/queries/teams";
import { getMyPendingDeletionRequest } from "@/lib/queries/organizations";
import { ProfileForm } from "@/app/(account)/account/settings/profile-form";
import { OrgMemberships } from "@/app/(account)/account/settings/org-memberships";
import { SecurityForm } from "@/app/(account)/account/settings/security-form";
import { DataPrivacy } from "@/app/(account)/account/settings/data-privacy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [memberships, pendingInvites, pendingDeletion] = await Promise.all([
    listMyOrgMemberships(),
    listMyPendingInvites(),
    getMyPendingDeletionRequest(),
  ]);

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile, organizations, and account.
        </p>
      </div>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={profile.fullName}
            email={profile.email}
            phone={profile.phone}
            country={profile.country}
            region={profile.region}
            avatarUrl={profile.avatarUrl}
            initials={initials}
          />
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">Organization Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgMemberships
            memberships={memberships}
            pendingInvites={pendingInvites}
            activeOrganizationId={profile.organizationId}
          />
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">Security</CardTitle>
        </CardHeader>
        <CardContent>
          <SecurityForm />
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">Data &amp; Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <DataPrivacy pendingRequest={pendingDeletion !== null} />
        </CardContent>
      </Card>
    </div>
  );
}
