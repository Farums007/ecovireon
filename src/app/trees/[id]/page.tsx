import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Calendar, Cloud, MapPin, Ruler, Sprout, User } from "lucide-react";
import { getTree } from "@/lib/queries/trees";
import { listTreeCheckins } from "@/lib/queries/tree-checkins";
import { getTreePhotoUrl } from "@/lib/storage-urls";
import { getCurrentProfile } from "@/lib/queries/profile";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { CheckinDialog } from "@/app/trees/[id]/checkin-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Verified",
  rejected: "Rejected",
  flagged: "Under review",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tree = await getTree(id);
  return {
    title: tree ? tree.species : "Tree not found",
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p>
        <span className="font-medium text-foreground">{label}</span>{" "}
        <span className="text-muted-foreground">{value}</span>
      </p>
    </div>
  );
}

export default async function TreeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ justPlanted?: string }>;
}) {
  const { id } = await params;
  const { justPlanted } = await searchParams;
  const [tree, profile, checkins] = await Promise.all([
    getTree(id),
    getCurrentProfile(),
    listTreeCheckins(id),
  ]);
  if (!tree) notFound();

  const isOwner = profile?.id === tree.ownerId;
  const isFirstVerifiedTree =
    isOwner && tree.status === "approved" && profile?.treesPlantedCount === 1;

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {isFirstVerifiedTree && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm sm:p-5">
            <p className="text-base font-bold text-foreground">
              🌱 Congratulations — you planted your first tree!
            </p>
            <p className="mt-1 text-foreground/80">
              It&apos;s verified and yours forever. You&apos;ve unlocked the
              Seedling badge — check your profile to see it.
            </p>
          </div>
        )}
        {!isFirstVerifiedTree && justPlanted === "1" && (
          <p className="mb-6 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
            Your tree has been logged and is pending verification. Once
            approved, it&apos;ll appear on the public map and count toward
            your badges.
          </p>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {tree.species}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant={tree.status === "approved" ? "default" : "outline"}>
              {STATUS_LABEL[tree.status]}
            </Badge>
            {isOwner && <CheckinDialog treeId={id} />}
          </div>
        </div>

        <div className="relative mb-6 h-72 w-full overflow-hidden rounded-xl border border-border shadow-sm sm:h-96">
          <Image
            src={getTreePhotoUrl(tree.photoPath)}
            alt={tree.species}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/80">
            <CardContent className="space-y-3 pt-6 text-sm">
              <InfoRow icon={User} label="Planted by" value={tree.ownerName ?? "an Ecovireon member"} />
              <InfoRow
                icon={Calendar}
                label="Date"
                value={new Date(tree.observedAt).toLocaleDateString()}
              />
              {tree.heightNote && (
                <InfoRow icon={Ruler} label="Height" value={tree.heightNote} />
              )}
              {tree.locationLabel && (
                <InfoRow icon={MapPin} label="Location" value={tree.locationLabel} />
              )}
              {tree.soilType && (
                <InfoRow icon={Sprout} label="Soil type" value={tree.soilType} />
              )}
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="space-y-3 pt-6 text-sm">
              {tree.location && (
                <InfoRow
                  icon={MapPin}
                  label="GPS"
                  value={`${tree.location.coordinates[1].toFixed(5)}, ${tree.location.coordinates[0].toFixed(5)}${
                    tree.gpsAccuracyM ? ` (±${Math.round(tree.gpsAccuracyM)}m)` : ""
                  }`}
                />
              )}
              <InfoRow
                icon={Cloud}
                label="Estimated CO2 offset"
                value={`${tree.co2EstimateKg} kg`}
              />
              {tree.notes && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Notes</span>{" "}
                  {tree.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {checkins.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Growth timeline</h2>
            <div className="space-y-4">
              {checkins.map((checkin) => (
                <Card key={checkin.id} className="border-border/80">
                  <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
                    {checkin.photoPath && (
                      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-32">
                        <Image
                          src={getTreePhotoUrl(checkin.photoPath)}
                          alt={`${tree.species} check-in photo`}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1 text-sm">
                      <p className="font-medium text-foreground">
                        {new Date(checkin.observedAt).toLocaleDateString()}
                      </p>
                      {checkin.heightNote && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Height:</span>{" "}
                          {checkin.heightNote}
                        </p>
                      )}
                      {checkin.notes && <p className="text-foreground/90">{checkin.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
