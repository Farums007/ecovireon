import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ecovireon — Restoration Data Platform",
    short_name: "Ecovireon",
    description: "Plan, manage, monitor, verify, and report nature-based projects.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a02d",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
