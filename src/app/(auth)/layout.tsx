import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-muted/30 px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-accent/70 to-transparent"
      />
      <Link
        href="/"
        className="relative mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-px"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to home
      </Link>
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="full" tone="green" height={34} href={null} priority />
          <p className="mt-3 text-sm text-muted-foreground">
            Trusted data for nature-based restoration
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
