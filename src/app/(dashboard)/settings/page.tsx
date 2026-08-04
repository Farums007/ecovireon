import { getCurrentProfile } from "@/lib/queries/profile";
import { getOrganizationProfile, getPendingOrgDeletionRequest } from "@/lib/queries/organizations";
import { OrgProfileForm } from "@/app/(dashboard)/settings/org-profile-form";
import { DataManagement } from "@/app/(dashboard)/settings/data-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const isAdmin = profile.role === "admin";
  const [organization, pendingDeletion] = await Promise.all([
    getOrganizationProfile(profile.organizationId),
    isAdmin ? getPendingOrgDeletionRequest(profile.organizationId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Organization profile and data.</p>
      </div>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">Organization Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin && organization ? (
            <OrgProfileForm organization={organization} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Only organization admins can update these settings.
            </p>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="max-w-lg border-border/80">
          <CardHeader>
            <CardTitle className="text-sm">Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <DataManagement pendingRequest={pendingDeletion !== null} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
