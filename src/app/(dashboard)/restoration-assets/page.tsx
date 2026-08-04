import Image from "next/image";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listProjects, RESTORATION_ASSET_LABELS } from "@/lib/queries/projects";
import { listOrgObservationsByStatus, getSignedPhotoUrls } from "@/lib/queries/observations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RestorationAssetsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organizationId) return null;

  const projects = await listProjects(profile.organizationId);
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const assets = await listOrgObservationsByStatus(
    projects.map((p) => p.id),
    ["verified"]
  );
  const allPhotoPaths = assets.flatMap((a) => a.photoUrls);
  const signedPhotoUrls = await getSignedPhotoUrls(allPhotoPaths);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Restoration Assets</h1>
        <p className="mt-1 text-muted-foreground">
          {assets.length} verified asset{assets.length === 1 ? "" : "s"} across every project.
        </p>
      </div>

      {assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No verified Restoration Assets yet — they appear here once field observations are verified.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset) => {
            const project = projectById.get(asset.projectId);
            const assetLabel = project ? RESTORATION_ASSET_LABELS[project.restorationType] : "Restoration Asset";
            const firstPhoto = asset.photoUrls[0];
            return (
              <Card key={asset.id} className="overflow-hidden border-border/80">
                {firstPhoto && signedPhotoUrls[firstPhoto] && (
                  <div className="relative h-32 w-full">
                    <Image
                      src={signedPhotoUrls[firstPhoto]}
                      alt={assetLabel}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">{assetLabel}</CardTitle>
                    <Badge>Verified</Badge>
                  </div>
                  {project && <p className="text-xs text-muted-foreground">{project.name}</p>}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {new Date(asset.observedAt).toLocaleDateString()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
