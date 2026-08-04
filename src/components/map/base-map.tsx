"use client";

import { forwardRef } from "react";
import { Map, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export type MapStyleVariant = "standard" | "satellite" | "terrain";

const STYLE_IDS: Record<MapStyleVariant, string> = {
  standard: "streets-v2",
  satellite: "hybrid",
  terrain: "topo-v2",
};

function styleUrl(variant: MapStyleVariant) {
  return MAPTILER_KEY
    ? `https://api.maptiler.com/maps/${STYLE_IDS[variant]}/style.json?key=${MAPTILER_KEY}`
    : undefined;
}

export const DEFAULT_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};

type BaseMapProps = React.ComponentProps<typeof Map> & {
  styleVariant?: MapStyleVariant;
};

// Defaults to "satellite" (MapTiler's "hybrid" style) — the app's
// original single hardcoded style, kept as the default so every
// existing map usage renders exactly as before unless it opts into the
// switcher via styleVariant.
export const BaseMap = forwardRef<MapRef, BaseMapProps>(function BaseMap(
  { children, styleVariant = "satellite", ...props },
  ref
) {
  const mapStyle = styleUrl(styleVariant);

  if (!mapStyle) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
        Set NEXT_PUBLIC_MAPTILER_KEY to enable the map.
      </div>
    );
  }

  return (
    <Map
      ref={ref}
      mapStyle={mapStyle}
      initialViewState={DEFAULT_VIEW_STATE}
      style={{ width: "100%", height: "100%" }}
      {...props}
    >
      {children}
    </Map>
  );
});
