"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  createProject,
  type ProjectFormState,
} from "@/app/(dashboard)/projects/actions";
import { BoundaryDrawer } from "@/components/map/boundary-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Polygon } from "@/lib/queries/projects";

export function ProjectForm() {
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(createProject, null);
  const [boundary, setBoundary] = useState<Polygon | null>(null);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType">Project type</Label>
              <Select name="projectType" defaultValue="restoration" required>
                <SelectTrigger id="projectType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restoration">Restoration</SelectItem>
                  <SelectItem value="conservation">Conservation</SelectItem>
                  <SelectItem value="urban_forestry">Urban forestry</SelectItem>
                  <SelectItem value="carbon">Carbon-ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="planning" required>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">Goals (one per line)</Label>
            <Textarea
              id="goals"
              name="goals"
              rows={3}
              placeholder={"Restore 50 hectares of mangrove\nEstablish community monitoring team"}
            />
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
            <Checkbox id="isPublic" name="isPublic" className="mt-0.5" />
            <Label htmlFor="isPublic" className="font-normal text-muted-foreground">
              Show this project&apos;s boundary on Ecovireon&apos;s public map
            </Label>
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
          <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
            {pending ? "Creating..." : "Create project"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site boundary</CardTitle>
        </CardHeader>
        <CardContent>
          <BoundaryDrawer onChange={setBoundary} />
          <input
            type="hidden"
            name="boundary"
            value={boundary ? JSON.stringify(boundary) : ""}
          />
        </CardContent>
      </Card>
    </form>
  );
}
