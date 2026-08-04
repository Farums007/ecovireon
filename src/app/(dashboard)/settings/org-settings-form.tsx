"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  updateOrganizationNameAction,
  type SettingsActionState,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgSettingsForm({ organizationName }: { organizationName: string }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateOrganizationNameAction,
    null
  );

  useEffect(() => {
    if (state && "success" in state) toast.success("Organization name updated");
  }, [state]);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" name="name" defaultValue={organizationName} required />
      </div>
      {state && "error" in state && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
