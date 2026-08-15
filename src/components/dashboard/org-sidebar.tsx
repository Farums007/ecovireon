"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Globe2,
  History,
  LayoutDashboard,
  LineChart,
  Map,
  MapPin,
  Settings,
  ShieldCheck,
  Sprout,
  Users2,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Restoration Projects", icon: Globe2 },
  { href: "/field-operations", label: "Field Operations", icon: MapPin },
  { href: "/gis", label: "GIS & Maps", icon: Map },
  { href: "/restoration-assets", label: "Restoration Assets", icon: Sprout },
  { href: "/verification", label: "Verification", icon: ShieldCheck },
  { href: "/monitoring", label: "Monitoring", icon: LineChart },
  { href: "/impact", label: "Impact & Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/activity", label: "Activity", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isNavItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
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

// Desktop only — mobile has its own purpose-built header/bottom-nav/sheet
// (MobileHeader, MobileBottomNav, MobileNavSheet), not a squeezed version
// of this sidebar.
export function OrgSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background py-6 lg:flex">
      <div className="mb-6 px-4">
        <Logo variant="full" tone="green" height={24} href="/dashboard" />
      </div>
      <NavLinks />
    </aside>
  );
}
