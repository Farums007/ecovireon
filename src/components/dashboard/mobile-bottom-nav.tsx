"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe2, MapPin, ShieldCheck, Menu } from "lucide-react";
import { isNavItemActive } from "@/components/dashboard/org-sidebar";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Globe2 },
  { href: "/field-operations", label: "Field Ops", icon: MapPin },
  { href: "/verification", label: "Verify", icon: ShieldCheck },
];

export function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {TABS.map((tab) => {
        const active = isNavItemActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-all active:translate-y-px",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon className="size-5.5" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-transform active:translate-y-px"
      >
        <Menu className="size-5.5" aria-hidden="true" />
        Menu
      </button>
    </nav>
  );
}
