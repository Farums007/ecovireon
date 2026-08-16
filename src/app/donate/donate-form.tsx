"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  initializeDonation,
  type DonateFormState,
} from "@/app/donate/actions";
import { PRICE_PER_TREE_KOBO } from "@/lib/donations";
import { formatApproxForeignEquivalents, formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const PRESET_COUNTS = [1, 5, 10, 25];

export function DonateForm({
  projects,
  isSignedIn,
}: {
  projects: { id: string; name: string }[];
  isSignedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    DonateFormState,
    FormData
  >(initializeDonation, null);
  const [treeCount, setTreeCount] = useState(5);

  return (
    <Card className="shadow-lg shadow-black/5">
      <CardContent className="space-y-6 pt-6">
        <form action={formAction} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label>How many trees?</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COUNTS.map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant={treeCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTreeCount(count)}
                  aria-pressed={treeCount === count}
                >
                  {count}
                </Button>
              ))}
              <Input
                type="number"
                min={1}
                value={treeCount}
                onChange={(e) => setTreeCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-24"
                aria-label="Custom tree count"
              />
            </div>
            <input type="hidden" name="treeCount" value={treeCount} />
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                {formatNaira(PRICE_PER_TREE_KOBO)} per tree
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatNaira(treeCount * PRICE_PER_TREE_KOBO)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatApproxForeignEquivalents(treeCount * PRICE_PER_TREE_KOBO)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Support a specific project (optional)</Label>
            <Select name="projectId">
              <SelectTrigger id="projectId" className="w-full">
                <SelectValue placeholder="General fund — we'll direct it where it's needed" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              ? "Starting checkout..."
              : isSignedIn
                ? `Donate ${formatNaira(treeCount * PRICE_PER_TREE_KOBO)}`
                : "Sign in to donate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
