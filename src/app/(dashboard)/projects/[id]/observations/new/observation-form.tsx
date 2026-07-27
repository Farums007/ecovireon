"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, MapPin, Save } from "lucide-react";
import {
  createObservation,
  type ObservationFormState,
} from "@/app/(dashboard)/projects/[id]/observations/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Draft = { notes: string; metrics: string; lat: string; lng: string };

function draftKey(projectId: string) {
  return `ecovireon:observation-draft:${projectId}`;
}

export function ObservationForm({ projectId }: { projectId: string }) {
  const boundAction = createObservation.bind(null, projectId);
  const [state, formAction, pending] = useActionState<
    ObservationFormState,
    FormData
  >(boundAction, null);

  const [draft, setDraft] = useState<Draft>({
    notes: "",
    metrics: "",
    lat: "",
    lng: "",
  });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Hydrating a text-field draft from localStorage after mount; a
    // one-frame mismatch with the server-rendered empty state is expected
    // and harmless here.
    const saved = localStorage.getItem(draftKey(projectId));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setDraft(JSON.parse(saved));
  }, [projectId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(draftKey(projectId), JSON.stringify(draft));
      setSavedAt(new Date());
    }, 400);
    return () => clearTimeout(timeout);
  }, [draft, projectId]);

  useEffect(() => {
    if (state === null) return;
    if (!("error" in (state ?? {}))) {
      localStorage.removeItem(draftKey(projectId));
    }
  }, [state, projectId]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((d) => ({
          ...d,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        setLocationError(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="observedAt">Observed at</Label>
            <Input
              id="observedAt"
              name="observedAt"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="lat"
                type="number"
                step="any"
                placeholder="Latitude"
                value={draft.lat}
                onChange={(e) => setDraft((d) => ({ ...d, lat: e.target.value }))}
              />
              <Input
                name="lng"
                type="number"
                step="any"
                placeholder="Longitude"
                value={draft.lng}
                onChange={(e) => setDraft((d) => ({ ...d, lng: e.target.value }))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              <MapPin className="size-4" aria-hidden="true" />
              {locating ? "Getting location..." : "Use my current location"}
            </Button>
            {locationError && (
              <p className="text-sm text-destructive" role="alert">
                {locationError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metrics">Metrics (one per line, key: value)</Label>
            <Textarea
              id="metrics"
              name="metrics"
              rows={4}
              placeholder={"canopy_cover_percent: 45\nspecies_count: 12\nsurvival_rate: 0.87"}
              value={draft.metrics}
              onChange={(e) => setDraft((d) => ({ ...d, metrics: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">Photos</Label>
            <Input id="photos" name="photos" type="file" accept="image/*" multiple capture="environment" />
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting..." : "Submit observation"}
            </Button>
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Save className="size-3.5" aria-hidden="true" />
                Draft saved
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
