import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Cloud, HeartHandshake, Sprout } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { formatNaira } from "@/lib/format";
import { listBadgeDefinitions, listEarnedBadges } from "@/lib/queries/badges";
import { listMyTrees } from "@/lib/queries/trees";
import { listMyProjects } from "@/lib/queries/projects";
import { getTreePhotoUrl } from "@/lib/storage-urls";
import { EditProfileDialog } from "@/app/(account)/account/edit-profile-dialog";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Verified",
  rejected: "Rejected",
  flagged: "Under review",
};

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [allBadges, earnedBadges, trees, myProjects] = await Promise.all([
    listBadgeDefinitions(),
    listEarnedBadges(profile.id),
    listMyTrees(),
    listMyProjects(profile.id),
  ]);

  const earnedKeys = new Set(earnedBadges.map((b) => b.key));
  const nextBadge = allBadges.find(
    (b) => !earnedKeys.has(b.key) && b.treeThreshold > profile.treesPlantedCount
  );
  const progressPct = nextBadge
    ? Math.min(100, Math.round((profile.treesPlantedCount / nextBadge.treeThreshold) * 100))
    : 100;

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/u/${profile.id}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-border">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.fullName || "Your profile"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {profile.email}
              {profile.country ? ` · ${profile.country}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EditProfileDialog
            fullName={profile.fullName}
            country={profile.country}
            avatarUrl={profile.avatarUrl}
            showCountry={profile.accountType === "individual"}
            initials={initials}
          />
          {profile.accountType === "individual" && (
            <ShareButton
              url={profileUrl}
              text={`I've planted ${profile.treesPlantedCount} verified ${profile.treesPlantedCount === 1 ? "tree" : "trees"} on Ecovireon 🌱`}
              label="Share profile"
              size="lg"
            />
          )}
          <Button
            nativeButton={false}
            variant="outline"
            size="lg"
            render={<Link href="/donate">Donate</Link>}
          />
          <Button
            nativeButton={false}
            size="lg"
            render={<Link href="/account/plant">Plant a tree</Link>}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <Card className="border-border/80">
          <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total donated
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <HeartHandshake className="size-4 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {formatNaira(profile.donationsTotalKobo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {myProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Your projects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myProjects.map(({ project, role, title }) => (
              <Link
                key={project.id}
                href={`/account/projects/${project.id}`}
                className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Card className="h-full border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge className="capitalize">{project.status}</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {role.replace("_", " ")}
                      {title ? ` · ${title}` : ""}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Badges</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {allBadges.map((badge) => {
            const earned = earnedKeys.has(badge.key);
            return (
              <div
                key={badge.id}
                className={`group/badge relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-transform ${
                  earned
                    ? "border-primary/30 bg-primary/5 hover:-translate-y-0.5"
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
                {earned && profile.accountType === "individual" && (
                  <div className="absolute -top-2 -right-2 opacity-0 transition-opacity group-hover/badge:opacity-100 focus-within:opacity-100">
                    <ShareButton
                      url={profileUrl}
                      text={`I just earned the ${badge.icon} ${badge.name} badge on Ecovireon!`}
                      label=""
                      size="icon-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {nextBadge && (
          <div className="space-y-1.5">
            <div
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress toward ${nextBadge.name} badge`}
              className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {nextBadge.treeThreshold - profile.treesPlantedCount} more verified{" "}
              {nextBadge.treeThreshold - profile.treesPlantedCount === 1
                ? "tree"
                : "trees"}{" "}
              to earn {nextBadge.icon} {nextBadge.name}.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Your trees</h2>
        {trees.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              You haven&apos;t logged a tree yet.
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
                <Card className="h-full overflow-hidden border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{tree.species}</p>
                      <Badge
                        variant={tree.status === "approved" ? "default" : "outline"}
                      >
                        {STATUS_LABEL[tree.status]}
                      </Badge>
                    </div>
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
    </div>
  );
}
