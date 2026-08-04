import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ShareForm } from "@/app/(dashboard)/projects/[id]/share-form";
import { ShareButton } from "@/components/share-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, profile] = await Promise.all([getProject(id), getCurrentProfile()]);
  if (!project) notFound();

  const isOwnerOrgAdmin =
    profile?.role === "admin" && profile.organizationId === project.organizationId;
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/explore/projects/${id}`;

  return (
    <div className="grid max-w-3xl gap-6 pt-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Share settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isOwnerOrgAdmin ? (
            <ShareForm
              projectId={id}
              isPublic={project.isPublic}
              publicSections={project.publicSections}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Only this project&apos;s organization admin can manage sharing.
            </p>
          )}
        </CardContent>
      </Card>

      {project.isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Public link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- external QR service, not a local/optimizable asset */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`}
              alt={`QR code linking to the public page for ${project.name}`}
              width={180}
              height={180}
              className="rounded-lg border border-border"
            />
            <ShareButton
              url={publicUrl}
              text={`See the progress on ${project.name}, a restoration project on Ecovireon.`}
              label="Share"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
