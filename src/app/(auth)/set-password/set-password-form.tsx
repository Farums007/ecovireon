"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { setPassword, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SetPasswordForm({ initialFullName }: { initialFullName: string }) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    setPassword,
    null
  );

  return (
    <Card className="shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-xl">Finish setting up your account</CardTitle>
        <CardDescription>
          You&apos;ve been added to a project on Ecovireon. Set a password to
          get in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName">Your name</Label>
            <Input id="fullName" name="fullName" defaultValue={initialFullName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least 6 characters.
            </p>
          </div>
          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Saving..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
