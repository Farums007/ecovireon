"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  changePasswordAction,
  type SettingsActionState,
} from "@/app/(account)/account/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SecurityForm() {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    changePasswordAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("Password updated");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="max-w-sm space-y-4">
        <p className="text-sm font-medium text-foreground">Change password</p>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={8}
            required
          />
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
          {pending ? "Saving..." : "Update password"}
        </Button>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">Delete account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Head to Data &amp; Privacy below to request account deletion.
        </p>
      </div>
    </div>
  );
}
