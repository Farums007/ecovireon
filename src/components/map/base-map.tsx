"use client";

import { forwardRef } from "react";
import { Map, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const MAP_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
  : undefined;

export const DEFAULT_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};

type BaseMapProps = React.ComponentProps<typeof Map>;

export const BaseMap = forwardRef<MapRef, BaseMapProps>(function BaseMap(
  { children, ...props },
  ref
) {
  if (!MAP_STYLE) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
        Set NEXT_PUBLIC_MAPTILER_KEY to enable the map.
      </div>
    );
  }

  return (
    <Map
      ref={ref}
      mapStyle={MAP_STYLE}
      initialViewState={DEFAULT_VIEW_STATE}
      style={{ width: "100%", height: "100%" }}
      {...props}
    >
      {children}
    </Map>
  );
});
