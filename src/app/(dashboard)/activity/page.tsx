import Link from "next/link";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listOrgActivity } from "@/lib/queries/dashboard";
import { Card, CardContent } from "@/components/ui/card";

export default async function ActivityPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const activity = await listOrgActivity(profile.organizationId, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-muted-foreground">
          Everything happening across {profile.organizationName}&apos;s restoration programme.
        </p>
      </div>

      {activity.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No activity yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80">
          <CardContent className="divide-y divide-border p-0">
            {activity.map((event) => (
              <Link
                key={event.id}
                href={event.href}
                className="block px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <p className="text-sm text-foreground/90">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
