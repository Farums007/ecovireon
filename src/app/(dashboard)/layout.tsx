import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { logout } from "@/app/(auth)/actions";
import { EditProfileDialog } from "@/app/(account)/account/edit-profile-dialog";
import { Logo } from "@/components/brand/logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV_ITEMS: { href: string; label: string; roles: Array<"admin" | "field_staff" | "verifier"> }[] = [
  { href: "/projects", label: "Projects", roles: ["admin", "field_staff", "verifier"] },
  { href: "/map", label: "Map", roles: ["admin", "field_staff", "verifier"] },
  { href: "/donate", label: "Donate", roles: ["admin", "field_staff", "verifier"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.accountType !== "organization") redirect("/account");

  const role = profile.role ?? "field_staff";
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role[0].toUpperCase();

  return (
    <div className="flex min-h-svh flex-col bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo variant="full" tone="green" height={24} href="/projects" />
            <DashboardNav items={visibleNav} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm leading-tight sm:block">
              <p className="font-medium text-foreground">{profile.fullName || role}</p>
              <p className="text-muted-foreground">{profile.organizationName}</p>
            </div>
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
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
