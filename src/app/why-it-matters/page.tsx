import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Droplets, Leaf, Sprout, Users } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Why it matters",
  description:
    "Why tree planting and ecosystem restoration matter — for climate, biodiversity, water and soil, and local livelihoods.",
};

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

export default function WhyItMattersPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why tree planting and ecosystem restoration matter
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
            Restoration isn&apos;t just planting — it&apos;s rebuilding the
            systems people and the planet depend on.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Be part of the record
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Plant and log your own trees, or fund verified restoration work
              happening right now.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                nativeButton={false}
                size="lg"
                render={
                  <Link href="/signup?type=individual">
                    Start planting
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                }
              />
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                render={<Link href="/donate">Donate and plant a tree</Link>}
              />
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
