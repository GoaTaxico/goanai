"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { Copy } from "@/lib/copy";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
};

let deferredPrompt: InstallPrompt | null = null;
const promptListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPrompt;
    promptListeners.forEach((listener) => listener());
  });
}

function subscribePrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => promptListeners.delete(listener);
}

function currentPrompt() {
  return deferredPrompt;
}

function clearPrompt() {
  deferredPrompt = null;
  promptListeners.forEach((listener) => listener());
}

function subscribeDisplay(listener: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function installed() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function subscribeNothing() {
  return () => {};
}

function iosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallButton({ copy, light = false }: { copy: Copy; light?: boolean }) {
  const prompt = useSyncExternalStore(subscribePrompt, currentPrompt, () => null);
  const standalone = useSyncExternalStore(subscribeDisplay, installed, () => true);
  const ios = useSyncExternalStore(subscribeNothing, iosDevice, () => false);

  useEffect(() => {
    if (standalone || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install still works after a refresh if registration succeeds later.
    });
  }, [standalone]);

  if (standalone) return null;

  return (
    <div className="shrink-0 space-y-2">
      <button
        type="button"
        onClick={() => {
          if (!prompt) return;
          void prompt.prompt().then(clearPrompt);
        }}
        className={
          light
            ? "rounded-full border border-[#f2c98a]/50 px-3 py-1.5 text-sm"
            : "w-full rounded-full border border-[#f2c98a]/50 px-3 py-2 text-sm text-[#f7f3ea] hover:bg-white/10"
        }
      >
        {light ? copy.installShort : copy.install}
      </button>
      {!light && ios && !prompt ? (
        <p className="text-xs leading-5 text-[#c9ddd8]">{copy.installIos}</p>
      ) : null}
    </div>
  );
}
