import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listMyOrgMemberships } from "@/lib/queries/teams";
import { AccountProfileMenu } from "@/components/account/account-profile-menu";
import { InstallPrompt } from "@/components/install-prompt";
import { Logo } from "@/components/brand/logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { href: "/account", label: "My profile" },
  { href: "/account/plant", label: "Plant a tree" },
  { href: "/explore", label: "Explore map" },
  { href: "/donate", label: "Donate" },
  { href: "/account/settings", label: "Settings" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const memberships = await listMyOrgMemberships();

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <InstallPrompt />
      <header className="border-b border-border bg-background">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Logo variant="full" tone="green" height={24} href="/account" className="shrink-0" />
            <DashboardNav items={NAV_ITEMS} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <AccountProfileMenu fullName={profile.fullName} memberships={memberships} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
