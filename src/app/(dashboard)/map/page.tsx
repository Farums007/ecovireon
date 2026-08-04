import { redirect } from "next/navigation";

// Superseded by /gis (GIS & Maps) — kept as a redirect for old links/bookmarks.
export default function LegacyMapPage() {
  redirect("/gis");
}
