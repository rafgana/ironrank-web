"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useServiceWorker() {
  const [swStatus, setSwStatus] = useState<"idle" | "registered" | "failed">("idle");
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/ironrank/sw.js", { scope: "/ironrank/" })
        .then((reg) => {
          setSwStatus("registered");
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch(() => setSwStatus("failed"));

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (swStatus === "registered" && !isOnline) {
      setOfflineReady(true);
      const t = setTimeout(() => setOfflineReady(false), 4000);
      return () => clearTimeout(t);
    }
  }, [swStatus, isOnline]);

  return {
    swStatus,
    offlineReady,
    updateAvailable,
    isOnline,
    installPrompt,
    applyUpdate: () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
      });
    },
    promptInstall: async () => {
      if (!installPrompt) return false;
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      return choice.outcome === "accepted";
    },
  };
}

export function OfflineBanner() {
  const { isOnline, offlineReady, updateAvailable, applyUpdate } = useServiceWorker();

  if (isOnline && !offlineReady && !updateAvailable) return null;

  if (updateAvailable) {
    return (
      <div
        className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg animate-in"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-brand-500)",
          color: "var(--color-brand-500)",
        }}
      >
        <RefreshCw size={12} />
        Nueva versión disponible
        <button
          onClick={applyUpdate}
          className="ml-2 px-2 py-0.5 rounded-full"
          style={{ background: "var(--color-brand-500)", color: "#000" }}
        >
          Actualizar
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div
        className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg animate-in"
        style={{
          background: "var(--color-emerald)",
          color: "#000",
        }}
      >
        <Check size={12} />
        Listo para usar offline
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg animate-in"
      style={{
        background: "var(--color-destructive)",
        color: "#fff",
      }}
    >
      <CloudOff size={12} />
      Sin conexión · modo offline
    </div>
  );
}
