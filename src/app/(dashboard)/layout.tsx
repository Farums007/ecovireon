import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listMyOrgMemberships } from "@/lib/queries/teams";
import { listProjects } from "@/lib/queries/projects";
import { EditProfileDialog } from "@/app/(account)/account/edit-profile-dialog";
import { OrgSidebar } from "@/components/dashboard/org-sidebar";
import { OrgProfileMenu } from "@/components/dashboard/org-profile-menu";
import { MobileShell } from "@/components/dashboard/mobile-shell";
import { InstallPrompt } from "@/components/install-prompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.accountType !== "organization" || !profile.organizationId) redirect("/account");

  const [memberships, projects] = await Promise.all([
    listMyOrgMemberships(),
    listProjects(profile.organizationId),
  ]);
  const otherMemberships = memberships.filter((m) => m.organizationId !== profile.organizationId);

  const role = profile.role ?? "field_staff";
  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role[0].toUpperCase();

  return (
    <div className="flex min-h-svh bg-muted/20">
      <InstallPrompt />
      <OrgSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileShell
          organizationName={profile.organizationName ?? "Your organization"}
          fullName={profile.fullName}
          country={profile.country}
          avatarUrl={profile.avatarUrl}
          initials={initials}
          otherMemberships={otherMemberships}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        />
        <header className="hidden border-b border-border bg-background lg:block">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {profile.organizationName ?? "Your organization"}
              </h1>
              <p className="text-xs text-muted-foreground">Ecosystem Restoration Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/activity"
                aria-label="Activity"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <Bell className="size-4.5" aria-hidden="true" />
              </Link>
              <span className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground sm:inline-flex">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {profile.organizationName ?? "Your organization"}
              </span>
              <EditProfileDialog
                fullName={profile.fullName}
                country={profile.country}
                avatarUrl={profile.avatarUrl}
                showCountry={false}
                initials={initials}
                trigger={
                  <button
                    type="button"
                    aria-label="Edit profile"
                    className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Avatar className="size-8 border border-border">
                      {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                }
              />
              <OrgProfileMenu
                fullName={profile.fullName}
                role={profile.role}
                otherMemberships={otherMemberships}
              />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
