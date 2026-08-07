"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabs({
  projectId,
  showSettings,
}: {
  projectId: string;
  showSettings: boolean;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/field-operations`, label: "Field Operations" },
    { href: `${base}/gis`, label: "GIS" },
    { href: `${base}/restoration-assets`, label: "Restoration Assets" },
    { href: `${base}/monitoring`, label: "Monitoring" },
    { href: `${base}/verification`, label: "Verification" },
    { href: `${base}/impact`, label: "Impact" },
    { href: `${base}/funding`, label: "Funding" },
    { href: `${base}/reports`, label: "Reports" },
    { href: `${base}/timeline`, label: "Timeline" },
    ...(showSettings ? [{ href: `${base}/edit`, label: "Settings" }] : []),
    { href: `${base}/share`, label: "Share" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Project sections"
      className="flex snap-x snap-proximity gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 snap-start border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors lg:py-2",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
