"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Polygon } from "@/lib/queries/projects";

function parseCoordinates(raw: string): { lat: number; lng: number }[] | null {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const points: { lat: number; lng: number }[] = [];
  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    points.push({ lat, lng });
  }
  return points;
}

export function ManualCoordinatesInput({
  onApply,
}: {
  onApply: (boundary: Polygon) => void;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApply() {
    const points = parseCoordinates(raw);
    if (!points || points.length < 3) {
      setError('Enter at least 3 points, one per line, as "latitude, longitude".');
      return;
    }

    const ring = points.map((p) => [p.lng, p.lat] as [number, number]);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);

    setError(null);
    onApply({ type: "Polygon", coordinates: [ring] });
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={6}
        placeholder={"6.5244, 3.3792\n6.5250, 3.3800\n6.5230, 3.3810"}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        One point per line, as &quot;latitude, longitude&quot;. Needs at least 3
        points to form a boundary.
      </p>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={handleApply}>
        Apply coordinates
      </Button>
    </div>
  );
}
