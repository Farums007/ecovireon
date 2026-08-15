import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Cloud, Sprout } from "lucide-react";
import { getPublicIndividualProfile } from "@/lib/queries/profile";
import { listBadgeDefinitions, listEarnedBadges } from "@/lib/queries/badges";
import { listTreesByOwner } from "@/lib/queries/trees";
import { getTreePhotoUrl } from "@/lib/storage-urls";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicIndividualProfile(id);
  return {
    title: profile ? `${profile.fullName || "Ecovireon member"}'s trees` : "Profile not found",
    description: profile
      ? `${profile.fullName || "This member"} has planted ${profile.treesPlantedCount} verified trees on Ecovireon.`
      : undefined,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicIndividualProfile(id);
  if (!profile) notFound();

  const [allBadges, earnedBadges, trees] = await Promise.all([
    listBadgeDefinitions(),
    listEarnedBadges(profile.id),
    listTreesByOwner(profile.id),
  ]);

  const earnedKeys = new Set(earnedBadges.map((b) => b.key));
  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center gap-4">
          <Avatar className="size-16 border border-border">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.fullName || "Ecovireon member"}
            </h1>
            {profile.country && <p className="mt-1 text-muted-foreground">{profile.country}</p>}
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-border/80">
            <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Trees planted
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <Sprout className="size-4 text-primary" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{profile.treesPlantedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Estimated CO2 offset
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <Cloud className="size-4 text-primary" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{profile.co2EstimatedKg} kg</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Badges</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {allBadges.map((badge) => {
              const earned = earnedKeys.has(badge.key);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                    earned
                      ? "border-primary/30 bg-primary/5"
                      : "border-border opacity-40 grayscale"
                  }`}
                  title={badge.description}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {badge.icon}
                  </span>
                  <span className="text-xs font-semibold">{badge.name}</span>
                  <span className="text-[0.65rem] text-muted-foreground">
                    {badge.treeThreshold}+ trees
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Trees</h2>
          {trees.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No verified trees yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trees.map((tree) => (
                <Link
                  key={tree.id}
                  href={`/trees/${tree.id}`}
                  className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Card className="h-full overflow-hidden border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none">
                    <div className="relative h-32 w-full">
                      <Image
                        src={getTreePhotoUrl(tree.photoPath)}
                        alt={tree.species}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="space-y-1 pt-4">
                      <p className="font-medium">{tree.species}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tree.observedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
