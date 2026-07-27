"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Source, Layer, Marker, type MapRef } from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import { BaseMap } from "@/components/map/base-map";
import type { Point, Polygon } from "@/lib/queries/projects";

type ProjectSummary = { id: string; boundary: Polygon | null };
type TreeMarker = { id: string; location: Point };

export function ExploreMap({
  projects,
  trees,
}: {
  projects: ProjectSummary[];
  trees: TreeMarker[];
}) {
  const mapRef = useRef<MapRef>(null);
  const router = useRouter();

  const boundaries = projects.filter(
    (p): p is ProjectSummary & { boundary: Polygon } => !!p.boundary
  );

  const fitToAll = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = new LngLatBounds();
    boundaries.forEach((p) =>
      p.boundary.coordinates[0].forEach(([lng, lat]) => bounds.extend([lng, lat]))
    );
    trees.forEach((t) => bounds.extend(t.location.coordinates));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 0 });
    }
  }, [boundaries, trees]);

  return (
    <BaseMap ref={mapRef} onLoad={fitToAll}>
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
            paint={{ "fill-color": "#16a34a", "fill-opacity": 0.2 }}
          />
          <Layer
            id={`boundary-outline-${project.id}`}
            type="line"
            paint={{ "line-color": "#16a34a", "line-width": 2 }}
          />
        </Source>
      ))}

      {trees.map((tree) => (
        <Marker
          key={tree.id}
          longitude={tree.location.coordinates[0]}
          latitude={tree.location.coordinates[1]}
          color="#ea580c"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            router.push(`/trees/${tree.id}`);
          }}
        />
      ))}
    </BaseMap>
  );
}
