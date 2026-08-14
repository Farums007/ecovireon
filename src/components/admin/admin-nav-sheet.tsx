"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { MobileSheet } from "@/components/dashboard/mobile-sheet";
import { NAV_ITEMS, isAdminNavItemActive } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminNavSheet({
  open,
  onClose,
  fullName,
  logoutAction,
}: {
  open: boolean;
  onClose: () => void;
  fullName: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <MobileSheet open={open} onClose={onClose} side="left" title={fullName || "Admin menu"}>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isAdminNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <form action={logoutAction}>
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
