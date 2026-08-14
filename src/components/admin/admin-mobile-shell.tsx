"use client";

import { useState } from "react";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";
import { AdminNavSheet } from "@/components/admin/admin-nav-sheet";

export function AdminMobileShell({
  fullName,
  initials,
  logoutAction,
}: {
  fullName: string;
  initials: string;
  logoutAction: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AdminMobileHeader initials={initials} onOpenMenu={() => setMenuOpen(true)} />
      <AdminNavSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        fullName={fullName}
        logoutAction={logoutAction}
      />
    </>
  );
}
