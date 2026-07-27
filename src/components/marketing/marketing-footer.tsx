import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo variant="full" tone="green" height={28} />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              A trusted, verifiable record for nature-based restoration —
              built for organizations running programs and individuals
              planting their own trees.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Platform</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/explore" className="transition-colors hover:text-primary">
                  Explore the map
                </Link>
              </li>
              <li>
                <Link href="/donate" className="transition-colors hover:text-primary">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition-colors hover:text-primary">
                  Sign up
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-primary">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contact us</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:info@ecovireon.com"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  info@ecovireon.com
                </a>
              </li>
              <li>
                <a
                  href="mailto:help@ecovireon.com"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  help@ecovireon.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ecovireon. All rights reserved.</p>
          <p>Restoration data you can verify.</p>
        </div>
      </div>
    </footer>
  );
}
