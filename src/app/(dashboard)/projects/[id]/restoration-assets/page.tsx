import { notFound } from "next/navigation";
import Image from "next/image";
import { getProject, RESTORATION_ASSET_LABELS } from "@/lib/queries/projects";
import { listObservationsByStatus, getSignedPhotoUrls } from "@/lib/queries/observations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectRestorationAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const assets = await listObservationsByStatus(id, ["verified"]);
  const allPhotoPaths = assets.flatMap((a) => a.photoUrls);
  const signedPhotoUrls = await getSignedPhotoUrls(allPhotoPaths);
  const assetLabel = RESTORATION_ASSET_LABELS[project.restorationType];

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {assets.length} verified {assetLabel.toLowerCase()}
        {assets.length === 1 ? "" : "s"}.
      </p>

      {assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No verified Restoration Assets yet — they appear here once field observations are verified.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset) => {
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
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  <p>{new Date(asset.observedAt).toLocaleDateString()}</p>
                  {Object.entries(asset.metrics).slice(0, 2).map(([key, value]) => (
                    <p key={key}>
                      {key}: {value}
                    </p>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
