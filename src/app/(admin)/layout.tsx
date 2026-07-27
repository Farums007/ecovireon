import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { logout } from "@/app/(auth)/actions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: { template: "%s — Ecovireon Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isPlatformAdmin) redirect("/");

  const initials = profile.fullName
    ? profile.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  return (
    <div className="flex min-h-svh bg-muted/20">
      <AdminSidebar logoutAction={logout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end gap-3 border-b border-border bg-background px-6 py-3 lg:flex">
          <div className="text-right text-sm leading-tight">
            <p className="font-medium text-foreground">{profile.fullName}</p>
            <p className="text-muted-foreground">Platform admin</p>
          </div>
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
