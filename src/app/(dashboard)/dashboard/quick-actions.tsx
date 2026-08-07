"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, MapPinPlus, Plus, UserPlus } from "lucide-react";
import { MobileSheet } from "@/components/dashboard/mobile-sheet";

function ActionTile({
  href,
  onClick,
  icon: Icon,
  label,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}) {
  const className =
    "flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-4 text-center text-sm font-medium text-foreground transition-colors active:bg-muted";
  const content = (
    <>
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" aria-hidden={true} />
      </span>
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function QuickActions({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <ActionTile href="/projects/new" icon={Plus} label="New Project" />
        {projects.length === 1 ? (
          <ActionTile
            href={`/projects/${projects[0].id}/observations/new`}
            icon={MapPinPlus}
            label="New Observation"
          />
        ) : (
          <ActionTile
            onClick={() => setPickerOpen(true)}
            icon={MapPinPlus}
            label="New Observation"
          />
        )}
        <ActionTile href="/reports" icon={FileText} label="Generate Report" />
        <ActionTile href="/teams" icon={UserPlus} label="Invite Team Member" />
      </div>

      <MobileSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        side="bottom"
        title="New observation — choose a project"
      >
        <div className="flex flex-col gap-1 p-3">
          {projects.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No projects yet — create one first.
            </p>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/observations/new`}
                onClick={() => setPickerOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
              >
                {project.name}
              </Link>
            ))
          )}
        </div>
      </MobileSheet>
    </>
  );
}
