"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, LogOut, UserRound } from "lucide-react";
import { logout, switchToIndividualAction } from "@/app/(auth)/actions";
import { switchOrganizationAction } from "@/app/(account)/account/settings/actions";
import type { MyOrgMembership } from "@/lib/queries/teams";

const ROLE_LABELS: Record<string, string> = {
  admin: "Organization Admin",
  field_staff: "Field Officer",
  verifier: "Monitoring Officer",
};

// Plain hand-rolled dropdown, not Base UI's Menu — that combination
// crashed the whole tab on open in production (see marketing-header-
// client.tsx's ProfileMenu). Same fix applied here.
export function OrgProfileMenu({
  fullName,
  role,
  otherMemberships = [],
}: {
  fullName: string;
  role: string | null;
  otherMemberships?: MyOrgMembership[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "Member";

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
      >
        <span className="hidden leading-tight sm:block">
          <span className="block font-medium text-foreground">{fullName || "You"}</span>
          <span className="block text-xs text-muted-foreground">{roleLabel}</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-md"
        >
          <p className="px-1.5 pt-1 pb-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Switch to
          </p>
          {otherMemberships.map((membership) => (
            <form
              key={membership.organizationId}
              action={switchOrganizationAction.bind(null, membership.organizationId)}
            >
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none transition-all hover:bg-accent hover:text-accent-foreground active:translate-y-px"
              >
                <Building2 className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{membership.organizationName}</span>
              </button>
            </form>
          ))}
          <form action={switchToIndividualAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none transition-all hover:bg-accent hover:text-accent-foreground active:translate-y-px"
            >
              <UserRound className="size-4 shrink-0" aria-hidden="true" />
              Personal dashboard
            </button>
          </form>
          <div className="my-1 h-px bg-border" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none transition-all hover:bg-accent hover:text-accent-foreground active:translate-y-px"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
