"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { EditProfileDialog } from "@/app/(account)/account/edit-profile-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MobileHeader({
  organizationName,
  fullName,
  country,
  avatarUrl,
  initials,
  onOpenMenu,
}: {
  organizationName: string;
  fullName: string;
  country: string | null;
  avatarUrl: string | null;
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
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <Logo variant="icon" tone="green" height={26} href="/dashboard" />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {organizationName}
      </p>
      <Link
        href="/activity"
        aria-label="Activity"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
      >
        <Bell className="size-4.5" aria-hidden="true" />
      </Link>
      <EditProfileDialog
        fullName={fullName}
        country={country}
        avatarUrl={avatarUrl}
        showCountry={false}
        initials={initials}
        trigger={
          <button
            type="button"
            aria-label="Edit profile"
            className="shrink-0 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
          >
            <Avatar className="size-8 border border-border">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
    </header>
  );
}
