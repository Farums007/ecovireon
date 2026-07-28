"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PLATFORMS = [
  {
    name: "X",
    urlFor: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    urlFor: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    name: "Facebook",
    urlFor: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    urlFor: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export function ShareButton({
  url,
  text,
  label = "Share",
  variant = "outline",
  size = "sm",
}: {
  url: string;
  text: string;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon-sm";
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={size}
            aria-label={label || "Share"}
          >
            <Share2 className="size-4" aria-hidden="true" />
            {label}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your impact with the world.</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your planted trees or restoration
            project and celebrate your contribution to a greener future.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 truncate bg-transparent text-sm text-muted-foreground outline-none"
          />
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {copied ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" />
                Copy
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <Button
              key={platform.name}
              type="button"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <a href={platform.urlFor(url, text)} target="_blank" rel="noopener noreferrer">
                  {platform.name}
                </a>
              }
            />
          ))}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.share({ title: text, text, url }).catch(() => {})}
            >
              More...
            </Button>
          )}
        </div>

        <DialogClose render={<Button type="button" variant="ghost" className="w-full" />}>
          Close
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
