"use client";

import { useState } from "react";
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
  Menu,
  Settings,
  ShieldCheck,
  Sprout,
  Users2,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
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

export function OrgSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background py-6 lg:flex">
        <div className="mb-6 px-4">
          <Logo variant="full" tone="green" height={24} href="/dashboard" />
        </div>
        <NavLinks />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <Logo variant="full" tone="green" height={22} href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="org-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav id="org-mobile-nav" className="border-b border-border bg-background py-3 lg:hidden">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </>
  );
}
