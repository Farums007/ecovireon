"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  TreePine,
  Users2,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/trees", label: "Tree review", icon: TreePine },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/donations", label: "Donations", icon: Wallet },
  { href: "/admin/users", label: "Users", icon: Users2 },
  { href: "/admin/deletion-requests", label: "Deletion requests", icon: ShieldAlert },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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

export function AdminSidebar({
  logoutAction,
}: {
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background py-6 lg:flex">
        <div className="mb-6 px-4">
          <Logo variant="full" tone="green" height={24} href="/admin" />
          <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </p>
        </div>
        <NavLinks />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <Logo variant="full" tone="green" height={22} href="/admin" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav
          id="admin-mobile-nav"
          className="border-b border-border bg-background py-3 lg:hidden"
        >
          <NavLinks onNavigate={() => setOpen(false)} />
          <form action={logoutAction} className="mt-2 border-t border-border px-3 pt-3">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </nav>
      )}
    </>
  );
}
