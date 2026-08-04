import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { getProject, listProjectMembers, effectiveProjectRole } from "@/lib/queries/projects";
import { listObservations, getSignedPhotoUrls } from "@/lib/queries/observations";
import { getCurrentProfile } from "@/lib/queries/profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  needs_review: "Needs review",
  rejected: "Rejected",
};

export default async function FieldOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, profile, members, observations] = await Promise.all([
    getProject(id),
    getCurrentProfile(),
    listProjectMembers(id),
    listObservations(id),
  ]);
  if (!project) notFound();

  const myRole = effectiveProjectRole(project, profile, members);
  const canSubmit = myRole === "admin" || myRole === "field_staff";

  const allPhotoPaths = observations.flatMap((o) => o.photoUrls);
  const signedPhotoUrls = await getSignedPhotoUrls(allPhotoPaths);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {observations.length} field observation{observations.length === 1 ? "" : "s"}.
        </p>
        {canSubmit && (
          <Button
            nativeButton={false}
            size="sm"
            render={
              <Link href={`/projects/${id}/observations/new`}>
                <PlusCircle className="size-4" aria-hidden="true" />
                New observation
              </Link>
            }
          />
        )}
      </div>

      {observations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No observations submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {observations.map((observation) => (
            <Card key={observation.id} className="border-border/80">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">
                    {new Date(observation.observedAt).toLocaleString()}
                  </CardTitle>
                  <Badge
                    variant={observation.verificationStatus === "verified" ? "default" : "outline"}
                  >
                    {VERIFICATION_LABELS[observation.verificationStatus]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(observation.metrics).length > 0 && (
                  <ul className="space-y-1 text-muted-foreground">
                    {Object.entries(observation.metrics).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium text-foreground">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                )}
                {observation.notes && <p>{observation.notes}</p>}
                {observation.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {observation.photoUrls.map((path) =>
                      signedPhotoUrls[path] ? (
                        <a
                          key={path}
                          href={signedPhotoUrls[path]}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <Image
                            src={signedPhotoUrls[path]}
                            alt="Field observation photo"
                            width={80}
                            height={80}
                            unoptimized
                            className="h-20 w-20 rounded-md border border-border object-cover"
                          />
                        </a>
                      ) : null
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
