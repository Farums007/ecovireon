"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/(auth)/actions";
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

export function ForgotPasswordForm({ sent }: { sent: boolean }) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(requestPasswordReset, null);

  return (
    <Card className="shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to set a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>If an account exists for that email, a reset link is on its way.</span>
          </div>
        )}
        <form action={formAction} className="space-y-4" noValidate>
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
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 transition-all hover:underline active:translate-y-px"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
