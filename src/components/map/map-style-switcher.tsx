"use client";

import type { MapStyleVariant } from "@/components/map/base-map";
import { cn } from "@/lib/utils";

const OPTIONS: { value: MapStyleVariant; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "satellite", label: "Satellite" },
  { value: "terrain", label: "Terrain" },
];

export function MapStyleSwitcher({
  value,
  onChange,
}: {
  value: MapStyleVariant;
  onChange: (variant: MapStyleVariant) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Map style"
      className="absolute top-3 left-3 z-10 flex gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
