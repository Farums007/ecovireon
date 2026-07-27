"use client";

import { useActionState } from "react";
import { AlertCircle, FilePlus2 } from "lucide-react";
import {
  generateReport,
  type ReportFormState,
} from "@/app/(dashboard)/projects/[id]/reports/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ReportForm({ projectId }: { projectId: string }) {
  const boundAction = generateReport.bind(null, projectId);
  const [state, formAction, pending] = useActionState<
    ReportFormState,
    FormData
  >(boundAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <FilePlus2 className="size-4 text-muted-foreground" aria-hidden="true" />
          Generate report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Q3 monitoring summary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodStart">Period start</Label>
            <Input id="periodStart" name="periodStart" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodEnd">Period end</Label>
            <Input id="periodEnd" name="periodEnd" type="date" required />
          </div>
          <div className="sm:col-span-4">
            {state?.error && (
              <div
                role="alert"
                className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{state.error}</span>
              </div>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Generating..." : "Generate report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
