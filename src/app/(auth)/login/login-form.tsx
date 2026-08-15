"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { login, type AuthActionState } from "@/app/(auth)/actions";
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

export function LoginForm({
  justSignedUp,
  redirectTo,
}: {
  justSignedUp: boolean;
  redirectTo?: string;
}) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(login, null);

  return (
    <Card className="shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Access your profile, projects, and restoration data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {justSignedUp && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Account created. Check your email to confirm before signing in.</span>
          </div>
        )}
        <form action={formAction} className="space-y-4" noValidate>
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 transition-all hover:underline active:translate-y-px"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
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
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 transition-all hover:underline active:translate-y-px"
          >
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
