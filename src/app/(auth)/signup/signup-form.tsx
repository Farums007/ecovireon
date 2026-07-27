"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, TreePine, Building2 } from "lucide-react";
import { signup, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignupForm({
  initialAccountType,
}: {
  initialAccountType: "individual" | "organization";
}) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(signup, null);
  const [accountType, setAccountType] = useState(initialAccountType);

  return (
    <Card className="shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Join as an individual to start logging trees, or as an organization
          to plan and monitor restoration projects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="accountType" value={accountType} />
          <Tabs
            value={accountType}
            onValueChange={(value) =>
              setAccountType(value === "organization" ? "organization" : "individual")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="individual" className="flex-1 gap-1.5">
                <TreePine className="size-4" aria-hidden="true" />
                Individual
              </TabsTrigger>
              <TabsTrigger value="organization" className="flex-1 gap-1.5">
                <Building2 className="size-4" aria-hidden="true" />
                Organization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Your name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" placeholder="Nigeria" />
              </div>
            </TabsContent>

            <TabsContent value="organization" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization name</Label>
                <Input id="organizationName" name="organizationName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgFullName">Your name</Label>
                <Input id="orgFullName" name="fullName" required />
              </div>
            </TabsContent>
          </Tabs>

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
            {pending
              ? "Creating account..."
              : accountType === "individual"
                ? "Start planting"
                : "Create organization"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
