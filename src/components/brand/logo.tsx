import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SOURCES = {
  full: {
    green: "/logo/logo-full-green.png",
    black: "/logo/logo-full-black.png",
    white: "/logo/logo-full-white.png",
  },
  icon: {
    green: "/logo/logo-icon-green.png",
    black: "/logo/logo-icon-black.png",
    white: "/logo/logo-icon-white.png",
  },
} as const;

// Full lockup's natural aspect ratio (icon + wordmark).
const FULL_ASPECT = 4968 / 1146;

type LogoProps = {
  variant?: "full" | "icon";
  tone?: "green" | "black" | "white";
  height?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
};

export function Logo({
  variant = "full",
  tone = "green",
  height = 32,
  href = "/",
  className,
  priority,
}: LogoProps) {
  const src = SOURCES[variant][tone];
  const width = variant === "full" ? Math.round(height * FULL_ASPECT) : height;

  const image = (
    <Image
      src={src}
      alt="Ecovireon"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} aria-label="Ecovireon home" className="inline-flex shrink-0 items-center">
      {image}
    </Link>
  );
}
