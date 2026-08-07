"use client";

import { useState } from "react";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { MobileNavSheet } from "@/components/dashboard/mobile-nav-sheet";
import { NewObservationFab } from "@/components/dashboard/new-observation-fab";
import type { MyOrgMembership } from "@/lib/queries/teams";

export function MobileShell({
  organizationName,
  fullName,
  country,
  avatarUrl,
  initials,
  otherMemberships,
  projects,
}: {
  organizationName: string;
  fullName: string;
  country: string | null;
  avatarUrl: string | null;
  initials: string;
  otherMemberships: MyOrgMembership[];
  projects: { id: string; name: string }[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <MobileHeader
        organizationName={organizationName}
        fullName={fullName}
        country={country}
        avatarUrl={avatarUrl}
        initials={initials}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <MobileNavSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        fullName={fullName}
        otherMemberships={otherMemberships}
      />
      <NewObservationFab projects={projects} />
      <MobileBottomNav onOpenMenu={() => setMenuOpen(true)} />
    </>
  );
}
