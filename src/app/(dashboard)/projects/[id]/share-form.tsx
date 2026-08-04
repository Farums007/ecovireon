"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import {
  updateShareSettingsAction,
  type ShareActionState,
} from "@/app/(dashboard)/projects/[id]/share-actions";
import type { PublicSections } from "@/lib/queries/projects";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SECTION_LABELS: { key: keyof PublicSections; label: string }[] = [
  { key: "overview", label: "Project overview" },
  { key: "map", label: "Map & location" },
  { key: "photos", label: "Photos" },
  { key: "monitoring", label: "Monitoring updates" },
  { key: "impact", label: "Impact metrics" },
  { key: "partners", label: "Partners" },
];

export function ShareForm({
  projectId,
  isPublic,
  publicSections,
}: {
  projectId: string;
  isPublic: boolean;
  publicSections: PublicSections;
}) {
  const boundAction = updateShareSettingsAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ShareActionState, FormData>(
    boundAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
        <Checkbox id="isPublic" name="isPublic" className="mt-0.5" defaultChecked={isPublic} />
        <Label htmlFor="isPublic" className="font-normal text-muted-foreground">
          Enable a public page for this project — anyone with the link can view it, no login required
        </Label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">What&apos;s visible publicly</p>
        <div className="grid grid-cols-2 gap-2">
          {SECTION_LABELS.map((section) => (
            <div key={section.key} className="flex items-center gap-2">
              <Checkbox
                id={`section_${section.key}`}
                name={`section_${section.key}`}
                defaultChecked={publicSections[section.key]}
              />
              <Label htmlFor={`section_${section.key}`} className="font-normal text-muted-foreground">
                {section.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save sharing settings"}
      </Button>
    </form>
  );
}
