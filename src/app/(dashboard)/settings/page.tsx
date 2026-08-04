import { getCurrentProfile } from "@/lib/queries/profile";
import { OrgSettingsForm } from "@/app/(dashboard)/settings/org-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Organization profile.</p>
      </div>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="text-sm">Organization profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.role === "admin" ? (
            <OrgSettingsForm organizationName={profile.organizationName ?? ""} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Only organization admins can update these settings.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
