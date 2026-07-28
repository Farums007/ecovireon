import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Ecovireon team.",
};

const CONTACTS = [
  {
    email: "info@ecovireon.com",
    label: "General inquiries",
    body: "Questions about the platform, partnerships, or press.",
  },
  {
    email: "help@ecovireon.com",
    label: "Support",
    body: "Need a hand with your account, a project, or a donation?",
  },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-balance">
            Reach out to the Ecovireon team directly — we read every message.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-5 sm:grid-cols-2">
            {CONTACTS.map((contact) => (
              <Card key={contact.email} className="border-border/80">
                <CardContent className="space-y-3 pt-6 text-center">
                  <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{contact.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{contact.body}</p>
                  </div>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-block font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {contact.email}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
