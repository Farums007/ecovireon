"use client";

import { useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { LngLatBounds } from "maplibre-gl";
import { BaseMap } from "@/components/map/base-map";
import { Button } from "@/components/ui/button";
import type { Polygon } from "@/lib/queries/projects";

export function BoundaryDrawer({
  initialBoundary,
  onChange,
}: {
  initialBoundary?: Polygon | null;
  onChange: (boundary: Polygon | null) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const [hasBoundary, setHasBoundary] = useState(!!initialBoundary);

  useEffect(() => {
    return () => {
      drawRef.current?.stop();
    };
  }, []);

  function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map || drawRef.current) return;

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [new TerraDrawPolygonMode(), new TerraDrawSelectMode()],
    });
    drawRef.current = draw;
    draw.start();

    draw.on("finish", () => {
      const [feature] = draw.getSnapshot();
      if (feature?.geometry.type === "Polygon") {
        onChange(feature.geometry as Polygon);
        setHasBoundary(true);
        draw.setMode("select");
      }
    });

    draw.on("change", (_ids, type) => {
      if (type === "update") {
        const [feature] = draw.getSnapshot();
        if (feature?.geometry.type === "Polygon") {
          onChange(feature.geometry as Polygon);
        }
      }
    });

    if (initialBoundary) {
      draw.addFeatures([
        {
          id: crypto.randomUUID(),
          type: "Feature",
          geometry: initialBoundary,
          properties: { mode: "polygon" },
        },
      ]);
      draw.setMode("select");

      const bounds = new LngLatBounds();
      initialBoundary.coordinates[0].forEach(([lng, lat]) => bounds.extend([lng, lat]));
      map.fitBounds(bounds, { padding: 40, duration: 0 });
    }
  }

  function startDrawing() {
    drawRef.current?.clear();
    setHasBoundary(false);
    onChange(null);
    drawRef.current?.setMode("polygon");
  }

  function clearDrawing() {
    drawRef.current?.clear();
    setHasBoundary(false);
    onChange(null);
    drawRef.current?.setMode("select");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={startDrawing}>
          {hasBoundary ? "Redraw boundary" : "Draw boundary"}
        </Button>
        {hasBoundary && (
          <Button type="button" variant="ghost" size="sm" onClick={clearDrawing}>
            Clear
          </Button>
        )}
      </div>
      <div className="h-96 w-full overflow-hidden rounded-md border">
        <BaseMap ref={mapRef} onLoad={handleLoad} />
      </div>
      <p className="text-xs text-muted-foreground">
        Click &quot;Draw boundary&quot;, then click points on the map to trace
        the site. Double-click or click the first point again to finish.
      </p>
    </div>
  );
}
