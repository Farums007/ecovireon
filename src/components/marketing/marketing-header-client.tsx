"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu, Shield, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "@/app/(auth)/actions";

const NAV_LINKS = [
  { href: "/explore", label: "Explore map" },
  { href: "/donate", label: "Donate" },
  { href: "/why-it-matters", label: "Why it matters" },
  { href: "/contact", label: "Contact" },
];

type HeaderProfile = {
  fullName: string;
  accountType: "organization" | "individual";
  isPlatformAdmin: boolean;
  avatarUrl: string | null;
};

function initialsOf(fullName: string) {
  return fullName
    ? fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
}

function AuthButtons({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      <Button
        nativeButton={false}
        variant={mobile ? "outline" : "ghost"}
        render={<Link href="/login">Sign in</Link>}
      />
      <Button nativeButton={false} render={<Link href="/signup">Get started</Link>} />
    </>
  );
}

// Plain hand-rolled dropdown, not Base UI's Menu — that combination
// (Menu + Portal + Positioner) was reliably crashing the whole tab on
// open in production, with no JS error to catch or diagnose. This is
// the only menu-style popup in the app; everything else uses Dialog,
// which has no such issue. A simple controlled panel + click-outside is
// plenty for four static links and can't hit whatever that was.
function ProfileMenu({ profile }: { profile: HeaderProfile }) {
  const dashboardHref = profile.accountType === "individual" ? "/account" : "/projects";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const itemClassName =
    "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Avatar className="size-8 border border-border">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initialsOf(profile.fullName)}
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-md"
        >
          <p className="truncate px-1.5 py-1 text-xs font-medium text-muted-foreground">
            {profile.fullName || "Your account"}
          </p>
          <div className="my-1 h-px bg-border" />
          <Link href={dashboardHref} role="menuitem" className={itemClassName} onClick={() => setOpen(false)}>
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          {profile.isPlatformAdmin && (
            <Link href="/admin" role="menuitem" className={itemClassName} onClick={() => setOpen(false)}>
              <Shield className="size-4" aria-hidden="true" />
              Admin dashboard
            </Link>
          )}
          <div className="my-1 h-px bg-border" />
          <form action={logout}>
            <button type="submit" role="menuitem" className={`w-full ${itemClassName}`}>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function MarketingHeaderClient({
  profile,
}: {
  profile: HeaderProfile | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo variant="full" tone="green" height={30} priority />

        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {profile ? <ProfileMenu profile={profile} /> : <AuthButtons />}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-border/80 bg-background px-4 py-4 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-border/80 pt-4">
            {profile ? (
              <>
                <Button
                  nativeButton={false}
                  render={
                    <Link href={profile.accountType === "individual" ? "/account" : "/projects"}>
                      Dashboard
                    </Link>
                  }
                />
                <form action={logout}>
                  <Button type="submit" variant="outline" className="w-full">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <AuthButtons mobile />
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
