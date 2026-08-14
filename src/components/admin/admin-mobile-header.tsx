"use client";

import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminMobileHeader({
  initials,
  onOpenMenu,
}: {
  initials: string;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center gap-2 border-b border-border bg-background px-3 py-2.5 lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <Logo variant="icon" tone="green" height={26} href="/admin" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">Admin</p>
      <Avatar className="size-8 shrink-0 border border-border">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
