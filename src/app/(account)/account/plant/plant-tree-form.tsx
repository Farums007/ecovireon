"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import {
  plantTree,
  type PlantTreeFormState,
} from "@/app/(account)/account/plant/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LocationState =
  | { status: "requesting" }
  | { status: "granted"; lat: number; lng: number; accuracy: number }
  | { status: "denied"; message: string };

export function PlantTreeForm() {
  const [state, formAction, pending] = useActionState<
    PlantTreeFormState,
    FormData
  >(plantTree, null);
  const [location, setLocation] = useState<LocationState>({
    status: "requesting",
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      // Feature-detection on mount, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation({
        status: "denied",
        message: "Geolocation is not supported on this device.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          status: "granted",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        setLocation({
          status: "denied",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location access was denied. Ecovireon requires your device's GPS location to log a tree — this keeps the record trustworthy."
              : err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MapPin className="size-4.5 text-primary" aria-hidden="true" />
          Where are you planting?
        </CardTitle>
        <CardDescription>
          Ecovireon captures your device&apos;s GPS location automatically —
          locations can&apos;t be entered manually, so every tree&apos;s
          location is trustworthy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {location.status === "requesting" && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
            Requesting location access...
          </div>
        )}
        {location.status === "denied" && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{location.message}</span>
          </div>
        )}
        {location.status === "granted" && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Location captured ({location.lat.toFixed(5)},{" "}
              {location.lng.toFixed(5)}, accuracy ±
              {Math.round(location.accuracy)}m)
            </span>
          </div>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          {location.status === "granted" && (
            <>
              <input type="hidden" name="lat" value={location.lat} />
              <input type="hidden" name="lng" value={location.lng} />
              <input type="hidden" name="accuracy" value={location.accuracy} />
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="species">Species</Label>
            <Input id="species" name="species" placeholder="Mango tree" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightNote">Height</Label>
            <Input id="heightNote" name="heightNote" placeholder="3ft tall" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationLabel">Location</Label>
            <Input
              id="locationLabel"
              name="locationLabel"
              placeholder="Community school"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soilType">Soil type</Label>
            <Input id="soilType" name="soilType" placeholder="Loamy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pending || location.status !== "granted"}
          >
            {pending ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
