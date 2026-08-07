"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, UserRound } from "lucide-react";
import { MobileSheet } from "@/components/dashboard/mobile-sheet";
import { NAV_ITEMS, isNavItemActive } from "@/components/dashboard/org-sidebar";
import { logout, switchToIndividualAction } from "@/app/(auth)/actions";
import { switchOrganizationAction } from "@/app/(account)/account/settings/actions";
import { cn } from "@/lib/utils";
import type { MyOrgMembership } from "@/lib/queries/teams";

export function MobileNavSheet({
  open,
  onClose,
  fullName,
  otherMemberships,
}: {
  open: boolean;
  onClose: () => void;
  fullName: string;
  otherMemberships: MyOrgMembership[];
}) {
  const pathname = usePathname();

  return (
    <MobileSheet open={open} onClose={onClose} side="left" title={fullName || "Menu"}>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <p className="px-3 pt-1 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Switch to
        </p>
        {otherMemberships.map((membership) => (
          <form
            key={membership.organizationId}
            action={switchOrganizationAction.bind(null, membership.organizationId)}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
            >
              <Building2 className="size-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{membership.organizationName}</span>
            </button>
          </form>
        ))}
        <form action={switchToIndividualAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
          >
            <UserRound className="size-5 shrink-0" aria-hidden="true" />
            Personal dashboard
          </button>
        </form>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-5 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </MobileSheet>
  );
}
