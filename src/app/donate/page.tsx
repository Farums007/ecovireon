import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, Camera, MapPin } from "lucide-react";
import { listPublicProjects } from "@/lib/queries/projects";
import { getCurrentProfile } from "@/lib/queries/profile";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { DonateForm } from "@/app/donate/donate-form";

export const metadata: Metadata = {
  title: "Donate",
  description: "Fund a real, verified tree planted on your behalf.",
};

const TRUST_SIGNALS = [
  { icon: Camera, label: "Photo proof" },
  { icon: MapPin, label: "GPS verified" },
  { icon: Award, label: "Progress updates" },
];

export default async function DonatePage() {
  const [projects, profile] = await Promise.all([
    listPublicProjects(),
    getCurrentProfile(),
  ]);

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-14 sm:px-6 sm:py-16">
        {profile && (
          <Link
            href={profile.accountType === "individual" ? "/account" : "/dashboard"}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to your dashboard
          </Link>
        )}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Fund a tree, get a verified record
          </h1>
          <p className="mt-3 text-muted-foreground">
            An organization on the ground plants and verifies it — you get
            its photo, species, GPS location, and progress updates.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {TRUST_SIGNALS.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <item.icon className="size-3.5 text-primary" aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <DonateForm
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          isSignedIn={!!profile}
        />
      </main>
      <MarketingFooter />
    </div>
  );
}
