"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Pencil } from "lucide-react";
import {
  updateProfile,
  type UpdateProfileState,
} from "@/app/(account)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditProfileDialog({
  fullName,
  country,
  avatarUrl,
  showCountry,
  initials,
}: {
  fullName: string;
  country: string | null;
  avatarUrl: string | null;
  showCountry: boolean;
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateProfile, null);

  const submitted = useRef(false);
  useEffect(() => {
    if (pending) {
      submitted.current = true;
      return;
    }
    if (submitted.current && state && "success" in state) {
      toast.success("Profile updated");
      setOpen(false);
      setPreview(null);
    }
    submitted.current = false;
  }, [pending, state]);

  const errorMessage = state && "error" in state ? state.error : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Pencil className="size-4" aria-hidden="true" />
            Edit profile
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your name, photo, and location.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4" noValidate>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border border-border">
              {(preview ?? avatarUrl) && (
                <AvatarImage src={preview ?? avatarUrl ?? undefined} alt="" />
              )}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="avatar">Profile picture</Label>
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

          {showCountry && (
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={country ?? ""} />
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
