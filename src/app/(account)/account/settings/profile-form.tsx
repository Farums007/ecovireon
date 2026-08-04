"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  requestEmailChangeAction,
  updateProfileDetailsAction,
  type SettingsActionState,
} from "@/app/(account)/account/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  fullName,
  email,
  phone,
  country,
  region,
  avatarUrl,
  initials,
}: {
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  region: string | null;
  avatarUrl: string | null;
  initials: string;
}) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateProfileDetailsAction,
    null
  );
  const [preview, setPreview] = useState<string | null>(null);

  const [emailState, emailFormAction, emailPending] = useActionState<
    SettingsActionState,
    FormData
  >(requestEmailChangeAction, null);

  useEffect(() => {
    if (state && "success" in state) toast.success("Profile updated");
  }, [state]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-border">
            {(preview ?? avatarUrl) && <AvatarImage src={preview ?? avatarUrl ?? undefined} alt="" />}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="avatar">Profile photo</Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={fullName} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue={country ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">State / Province</Label>
            <Input id="region" name="region" defaultValue={region ?? ""} />
          </div>
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

      <div className="space-y-2 border-t border-border pt-4">
        <Label htmlFor="email">Email address</Label>
        <p className="text-xs text-muted-foreground">
          Currently <span className="font-medium text-foreground">{email}</span>. Changing it
          requires confirming the new address by email before it takes effect.
        </p>
        <form action={emailFormAction} className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="new@email.com"
            className="sm:max-w-xs"
            required
          />
          <Button type="submit" variant="outline" size="sm" disabled={emailPending}>
            {emailPending ? "Sending..." : "Change email"}
          </Button>
        </form>
        {emailState && "error" in emailState && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{emailState.error}</span>
          </div>
        )}
        {emailState && "success" in emailState && (
          <p className="text-xs text-primary">
            Check both your current and new inbox for confirmation links.
          </p>
        )}
      </div>
    </div>
  );
}
