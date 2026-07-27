"use client";

import { useCallback, useRef } from "react";
import { Source, Layer, Marker, type MapRef } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import { BaseMap } from "@/components/map/base-map";
import type { Point, Polygon } from "@/lib/queries/projects";

export function ProjectBoundaryMap({
  boundary,
  observations = [],
}: {
  boundary: Polygon | null;
  observations?: { id: string; location: Point }[];
}) {
  const mapRef = useRef<MapRef>(null);

  const fitToBoundary = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = new LngLatBounds();
    boundary?.coordinates[0].forEach(([lng, lat]) => bounds.extend([lng, lat]));
    observations.forEach((o) => bounds.extend(o.location.coordinates));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 40, duration: 0 });
    }
  }, [boundary, observations]);

  return (
    <BaseMap ref={mapRef} onLoad={fitToBoundary}>
      {boundary && (
        <Source id="project-boundary" type="geojson" data={boundary}>
          <Layer
            id="project-boundary-fill"
            type="fill"
            paint={{ "fill-color": "#16a34a", "fill-opacity": 0.25 }}
          />
          <Layer
            id="project-boundary-outline"
            type="line"
            paint={{ "line-color": "#16a34a", "line-width": 2 }}
          />
        </Source>
      )}
      {observations.map((o) => (
        <Marker
          key={o.id}
          longitude={o.location.coordinates[0]}
          latitude={o.location.coordinates[1]}
          color="#ea580c"
        />
      ))}
    </BaseMap>
  );
}
