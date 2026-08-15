"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ShieldAlert,
  TreePine,
  Users2,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/trees", label: "Tree review", icon: TreePine },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/donations", label: "Donations", icon: Wallet },
  { href: "/admin/users", label: "Users", icon: Users2 },
  { href: "/admin/deletion-requests", label: "Deletion requests", icon: ShieldAlert },
];

export function isAdminNavItemActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isAdminNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4.5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Desktop only — mobile has its own purpose-built header/nav sheet
// (AdminMobileHeader, AdminNavSheet), not a squeezed version of this
// sidebar. Mirrors the same fix already applied to OrgSidebar.
export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background py-6 lg:flex">
      <div className="mb-6 px-4">
        <Logo variant="full" tone="green" height={24} href="/admin" />
        <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
      </div>
      <NavLinks />
    </aside>
  );
}
