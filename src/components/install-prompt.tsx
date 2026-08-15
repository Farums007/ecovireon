"use client";

import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const DISMISSED_KEY = "ecovireon:install-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android";

// iOS Safari has no install API — the only way to add to the home screen
// is the manual Share-sheet flow, so that path always shows instructions.
// Chrome/Android does have an API (beforeinstallprompt): capture the
// event and trigger the real native prompt instead of describing steps.
export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);

    if (isIOS) {
      // One-time read of browser platform info on mount — there's no
      // external-system subscription to hook into here (unlike the
      // beforeinstallprompt listener below), so a direct set is correct.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlatform("ios");
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismissForNow() {
    setVisible(false);
  }

  function dismissForever() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    // Either they installed or explicitly declined the native prompt —
    // don't nag again either way.
    dismissForever();
  }

  if (!visible || !platform) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-black/50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Install Ecovireon"
    >
      <div className="w-full space-y-4 rounded-t-2xl bg-background p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon" tone="green" height={32} href={null} />
            <div>
              <p className="text-base font-bold text-foreground">Install Ecovireon</p>
              <p className="text-xs text-muted-foreground">
                Add it to your home screen for the best experience
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissForNow}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {platform === "ios" ? (
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                1
              </span>
              <span className="flex items-center gap-1.5">
                Tap the <Share2 className="inline size-4" aria-hidden="true" /> Share icon
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                2
              </span>
              <span>
                Scroll down and tap <span className="font-medium">Add to Home Screen</span>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                3
              </span>
              <span>Look for the Ecovireon icon on your home screen</span>
            </li>
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Install Ecovireon for quicker, full-screen access from your home screen.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {platform === "android" && (
            <Button type="button" size="lg" className="w-full" onClick={handleAndroidInstall}>
              Install app
            </Button>
          )}
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={dismissForever}>
            Don&apos;t show again
          </Button>
        </div>
      </div>
    </div>
  );
}
