import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  Camera,
  CheckCircle2,
  Droplets,
  Leaf,
  MapPin,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import { listPublicProjects } from "@/lib/queries/projects";
import { listApprovedTrees } from "@/lib/queries/trees";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { OrgMap } from "@/components/map/org-map";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: { absolute: "Ecovireon — Plant, verify, and track real trees" },
  description:
    "Ecovireon turns fragmented restoration data into a trusted, verifiable record — for organizations running restoration programs and individuals planting their own trees.",
};

const FEATURES = [
  {
    icon: MapPin,
    title: "Geotagged field data",
    body: "Every site, tree, and observation is captured with GPS location and a timestamp — no manual entry, no guesswork.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in verification",
    body: "Submissions are reviewed before they count, and duplicate or suspicious activity is flagged automatically.",
  },
  {
    icon: BarChart3,
    title: "Progress dashboards",
    body: "Track monitoring metrics over time and see restoration progress across every project in one place.",
  },
  {
    icon: Camera,
    title: "Photo evidence",
    body: "Field photos are attached to every observation and tree, so impact is visible, not just reported.",
  },
  {
    icon: Award,
    title: "Reports & carbon-ready data",
    body: "Generate stakeholder-ready CSV and PDF reports, and build the structured data future carbon financing needs.",
  },
  {
    icon: Users,
    title: "Built for everyone",
    body: "Organizations run full restoration programs; individuals log and track every tree they plant, personally.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Sign up",
    body: "Create an individual account to start planting, or an organization account to run a full program.",
  },
  {
    step: "02",
    title: "Log & verify",
    body: "Capture GPS-tagged trees and field data. Every submission is reviewed before it's counted.",
  },
  {
    step: "03",
    title: "Track impact",
    body: "Watch your trees, badges, and CO2 estimate grow — or your program's dashboards and reports.",
  },
];

const WHY_IT_MATTERS = [
  {
    icon: Leaf,
    title: "Climate",
    body: "Forests and healthy ecosystems absorb carbon and buffer communities against extreme weather.",
  },
  {
    icon: Sprout,
    title: "Biodiversity",
    body: "Restored habitats bring back the species that depend on them, from pollinators to migratory birds.",
  },
  {
    icon: Droplets,
    title: "Water & soil",
    body: "Root systems hold soil in place, recharge groundwater, and protect watersheds downstream.",
  },
  {
    icon: Users,
    title: "Livelihoods",
    body: "Restoration creates local jobs and strengthens the land communities depend on for food and income.",
  },
];

export default async function Home() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(profile.accountType === "individual" ? "/account" : "/dashboard");
  }

  const [publicProjects, approvedTrees] = await Promise.all([
    listPublicProjects(),
    listApprovedTrees(),
  ]);

  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/60 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-28">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
              <Leaf className="size-3.5" aria-hidden="true" />
              Nature-based restoration, verified
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Every tree planted deserves a verified record.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
              Ecovireon is the shared home for restoration data — geotagged,
              time-stamped, and verified from the field to the final report.
              Built for organizations running restoration programs, and for
              individuals who just want to plant a tree and know it counts.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                size="lg"
                className="w-full sm:w-auto"
                render={
                  <Link href="/signup?type=individual">
                    Sign up as an individual
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                }
              />
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                render={<Link href="/signup?type=organization">Sign up as an organization</Link>}
              />
            </div>
            <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-6 border-t border-border pt-8 text-left sm:grid-cols-3 sm:text-center">
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Public projects
                </dt>
                <dd className="mt-1 text-2xl font-bold text-foreground">
                  {publicProjects.length}+
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Verification
                </dt>
                <dd className="mt-1 text-2xl font-bold text-foreground">GPS-based</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Open to
                </dt>
                <dd className="mt-1 text-2xl font-bold text-foreground">Everyone</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* About */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Restoration data shouldn&apos;t live in a spreadsheet
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every year, governments, NGOs, corporations, and conservation
                organizations invest millions in tree planting and ecosystem
                restoration. Yet much of the data around these projects stays
                fragmented — scattered across spreadsheets, paper forms,
                messaging apps, GPS devices, and photo archives. That makes it
                hard to measure impact, demonstrate transparency, secure
                funding, and prepare projects for carbon markets.
              </p>
              <p className="mt-4 text-muted-foreground">
                Ecovireon provides centralized digital infrastructure for
                restoration — for organizations and individuals alike.
                Individuals can log and track every tree they plant;
                organizations can run entire restoration programs on the same
                trusted record.
              </p>
            </div>
            <ul className="grid gap-4 self-start sm:grid-cols-2 lg:grid-cols-1">
              {[
                "Capture geotagged field data from any device",
                "Monitor restoration progress over time",
                "Verify outcomes before they're counted",
                "Generate stakeholder-ready reports",
                "Build carbon-ready, financeable datasets",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Everything restoration data needs, in one place
              </h2>
              <p className="mt-3 text-muted-foreground">
                From a single planted tree to a multi-site restoration program.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="border-border/80">
                  <CardHeader>
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="pt-3 text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.body}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative text-center sm:text-left">
                <span className="text-4xl font-bold text-primary/25">{item.step}</span>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our mission</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
              To make every restoration effort — big or small — measurable,
              transparent, and trusted, so the people funding it, the people
              doing it, and the planet it&apos;s meant to help can all see
              the same verified record.
            </p>
          </div>
        </section>

        {/* Why it matters */}
        <section id="why-it-matters" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Why tree planting and ecosystem restoration matter
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_IT_MATTERS.map((item) => (
              <Card key={item.title} className="border-border/80 text-center">
                <CardHeader className="items-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="pt-2 text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.body}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Map preview */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Restoration happening right now
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Public project sites tracked on Ecovireon, around the world.
                </p>
              </div>
              <Button
                nativeButton={false}
                variant="outline"
                render={
                  <Link href="/explore">
                    View the full map
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                }
              />
            </div>
            <div className="h-96 w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              <OrgMap
                projects={publicProjects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  boundary: p.boundary,
                }))}
                observations={approvedTrees
                  .filter((t) => t.location)
                  .map((t) => ({ id: t.id, location: t.location! }))}
              />
            </div>
          </div>
        </section>

        {/* Donate CTA */}
        <section className="bg-primary">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
              Can&apos;t plant one yourself? Fund one instead.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Your donation funds a real tree, planted and verified by an
              organization on the ground. You&apos;ll get its photo, species,
              location, and progress updates — impact you can actually see.
            </p>
            <Button
              nativeButton={false}
              size="lg"
              variant="secondary"
              className="mt-6"
              render={
                <Link href="/donate">
                  Donate and plant a tree
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
