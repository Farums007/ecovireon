"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { MobileSheet } from "@/components/dashboard/mobile-sheet";

export function NewObservationFab({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A project's own Field Operations tab already has a same-project "New
  // observation" entry point — no redundant second FAB fighting it there.
  const suppressed = /^\/projects\/[^/]+\/field-operations/.test(pathname);
  if (suppressed) return null;

  if (projects.length === 0) {
    return (
      <Link
        href="/projects/new"
        aria-label="Create a project"
        className="fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:translate-y-px active:scale-95 lg:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </Link>
    );
  }

  if (projects.length === 1) {
    return (
      <Link
        href={`/projects/${projects[0].id}/observations/new`}
        aria-label="New observation"
        className="fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:translate-y-px active:scale-95 lg:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New observation"
        aria-haspopup="dialog"
        className="fixed right-4 bottom-20 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:translate-y-px active:scale-95 lg:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>
      <MobileSheet open={open} onClose={() => setOpen(false)} side="bottom" title="New observation — choose a project">
        <div className="flex flex-col gap-1 p-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/observations/new`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-all hover:bg-muted active:translate-y-px"
            >
              {project.name}
            </Link>
          ))}
        </div>
      </MobileSheet>
    </>
  );
}
