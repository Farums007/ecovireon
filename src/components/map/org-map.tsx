"use client";

import { useCallback, useRef, useState } from "react";
import {
  Source,
  Layer,
  Marker,
  Popup,
  type MapRef,
} from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import Link from "next/link";
import { BaseMap, type MapStyleVariant } from "@/components/map/base-map";
import { MapStyleSwitcher } from "@/components/map/map-style-switcher";
import type { Point, Polygon } from "@/lib/queries/projects";

type ProjectSummary = { id: string; name: string; boundary: Polygon | null };
type ObservationMarker = { id: string; location: Point };

export function OrgMap({
  projects,
  observations,
  showStyleSwitcher = false,
}: {
  projects: ProjectSummary[];
  observations: ObservationMarker[];
  showStyleSwitcher?: boolean;
}) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<ProjectSummary | null>(null);
  const [styleVariant, setStyleVariant] = useState<MapStyleVariant>("satellite");

  const boundaries = projects.filter(
    (p): p is ProjectSummary & { boundary: Polygon } => !!p.boundary
  );

  const fitToAll = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = new LngLatBounds();
    boundaries.forEach((p) =>
      p.boundary.coordinates[0].forEach(([lng, lat]) => bounds.extend([lng, lat]))
    );
    observations.forEach((o) => bounds.extend(o.location.coordinates));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 0 });
    }
  }, [boundaries, observations]);

  return (
    <div className="relative h-full w-full">
      {showStyleSwitcher && (
        <MapStyleSwitcher value={styleVariant} onChange={setStyleVariant} />
      )}
      <BaseMap ref={mapRef} styleVariant={styleVariant} onLoad={fitToAll}>
      {boundaries.map((project) => (
        <Source
          key={project.id}
          id={`boundary-${project.id}`}
          type="geojson"
          data={project.boundary}
        >
          <Layer
            id={`boundary-fill-${project.id}`}
            type="fill"
            paint={{ "fill-color": "#16a34a", "fill-opacity": 0.25 }}
          />
          <Layer
            id={`boundary-outline-${project.id}`}
            type="line"
            paint={{ "line-color": "#16a34a", "line-width": 2 }}
          />
        </Source>
      ))}

      {boundaries.map((project) => {
        const [lng, lat] = project.boundary.coordinates[0][0];
        return (
          <Marker
            key={project.id}
            longitude={lng}
            latitude={lat}
            color="#16a34a"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(project);
            }}
          />
        );
      })}

      {observations.map((o) => (
        <Marker
          key={o.id}
          longitude={o.location.coordinates[0]}
          latitude={o.location.coordinates[1]}
          color="#ea580c"
        />
      ))}

      {selected && selected.boundary && (
        <Popup
          longitude={selected.boundary.coordinates[0][0][0]}
          latitude={selected.boundary.coordinates[0][0][1]}
          onClose={() => setSelected(null)}
          closeOnClick={false}
        >
          <Link
            href={`/projects/${selected.id}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            {selected.name}
          </Link>
        </Popup>
      )}
      </BaseMap>
    </div>
  );
}
