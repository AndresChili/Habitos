"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIos] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
  });
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (isStandalone) return null;
  if (!deferredPrompt && !isIos) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIos) setShowIosHint((v) => !v);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        Instalar app
      </button>

      {showIosHint && (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          Toca el botón Compartir <span aria-hidden>􀈂</span> y luego &ldquo;Añadir a pantalla de
          inicio&rdquo;.
        </p>
      )}
    </div>
  );
}
