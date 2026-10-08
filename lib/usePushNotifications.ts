"use client";

import { useEffect, useState } from "react";

// Phone push-notification state shared by every component on the page (the
// bell and the dashboard prompt card), so enabling it in one updates both.

export type PushState = "unsupported" | "ios-install" | "default" | "denied" | "on" | "off";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Phone pop-ups are a phone feature; on PCs the prompts are hidden (desktop
// browsers like Edge show the permission request as a quiet address-bar icon,
// which left the button stuck on "Please wait...").
function isMobileDevice() {
  return (
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Resolves to `fallback` if `promise` hasn't settled within `ms`.
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

let state: PushState = "off";
let busy = false;
let initialised = false;
const listeners = new Set<() => void>();

function set(next: { state?: PushState; busy?: boolean }) {
  if (next.state !== undefined) state = next.state;
  if (next.busy !== undefined) busy = next.busy;
  listeners.forEach((l) => l());
}

async function subscribe(): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator)) return false;
  try {
    const reg =
      (await withTimeout<ServiceWorkerRegistration | null>(navigator.serviceWorker.ready, 4000, null)) ||
      (await navigator.serviceWorker.getRegistration());
    if (!reg || !reg.pushManager) return false;

    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }),
        15000,
        null
      ));
    if (!sub) return false;
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Work out the current state once per page load; if permission was already
// granted, quietly (re)register this device for the logged-in user.
function init() {
  if (initialised) return;
  initialised = true;
  if (!VAPID_PUBLIC_KEY || !isMobileDevice()) return set({ state: "unsupported" });
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return set({ state: isIos && !standalone ? "ios-install" : "unsupported" });
  }
  if (Notification.permission === "denied") return set({ state: "denied" });
  if (Notification.permission === "default") return set({ state: "default" });
  subscribe().then((ok) => set({ state: ok ? "on" : "off" }));
}

async function enable() {
  if (busy) return;
  set({ busy: true });
  try {
    // If the browser never answers (e.g. a quiet permission prompt that's
    // ignored), give up after 20s instead of staying on "Please wait...".
    const perm = await withTimeout(Notification.requestPermission(), 20000, Notification.permission);
    if (perm === "granted") {
      const ok = await subscribe();
      set({ state: ok ? "on" : "off" });
    } else {
      set({ state: perm === "denied" ? "denied" : "default" });
    }
  } catch {
    set({ state: "off" });
  } finally {
    set({ busy: false });
  }
}

export function usePushNotifications() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    listeners.add(l);
    init();
    l(); // pick up any state set before this component mounted
    return () => {
      listeners.delete(l);
      // Leaving the logged-in screens (e.g. logout): re-check on the next
      // login, which may be a different user on the same phone.
      if (listeners.size === 0) initialised = false;
    };
  }, []);
  return { state, busy, enable };
}
