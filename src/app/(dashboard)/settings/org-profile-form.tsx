"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  updateOrganizationProfileAction,
  type SettingsActionState,
} from "@/app/(dashboard)/settings/actions";
import type { OrganizationProfile } from "@/lib/queries/organizations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrgProfileForm({ organization }: { organization: OrganizationProfile }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateOrganizationProfileAction,
    null
  );
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state && "success" in state) toast.success("Organization profile updated");
  }, [state]);

  const initials = organization.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          {(preview ?? organization.logoUrl) && (
            <AvatarImage src={preview ?? organization.logoUrl ?? undefined} alt="" />
          )}
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="logo">Organization logo</Label>
          <Input
            id="logo"
            name="logo"
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
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" name="name" defaultValue={organization.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What your organization does and where it works."
          defaultValue={organization.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orgType">Organization type</Label>
          <Select name="orgType" defaultValue={organization.orgType ?? undefined}>
            <SelectTrigger id="orgType" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nonprofit">Nonprofit / NGO</SelectItem>
              <SelectItem value="government">Government agency</SelectItem>
              <SelectItem value="company">Private company</SelectItem>
              <SelectItem value="academic">Academic / research institution</SelectItem>
              <SelectItem value="community">Community-based organization</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://example.org"
            defaultValue={organization.website ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orgEmail">Email</Label>
          <Input
            id="orgEmail"
            name="email"
            type="email"
            placeholder="contact@example.org"
            defaultValue={organization.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="e.g. Lagos, Nigeria"
            defaultValue={organization.location ?? ""}
          />
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
  );
}
