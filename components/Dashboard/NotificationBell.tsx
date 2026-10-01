"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string;
  section?: string;
  createdAt: string;
  read: boolean;
};

const POLL_MS = 30000;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type PushState = "unsupported" | "ios-install" | "default" | "denied" | "on" | "off";

// One bell for members, admins and citizens. `onNavigate` receives the
// notification's `section` so the host screen can open the right page.
export default function NotificationBell({
  onNavigate,
}: {
  onNavigate?: (section: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState<PushState>("off");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.status !== "success") return;
        setItems(d.notifications);
        setUnread(d.unread);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Close the panel when clicking outside it.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY || typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
    try {
      const reg =
        (await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ])) || (await navigator.serviceWorker.getRegistration());

      if (!reg || !reg.pushManager) return false;

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Work out the current push state; if permission was already granted,
  // quietly (re)register this device for the logged-in user.
  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return setPushState("unsupported");
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return setPushState(isIos && !standalone ? "ios-install" : "unsupported");
    }
    if (Notification.permission === "denied") return setPushState("denied");
    if (Notification.permission === "default") return setPushState("default");
    subscribe().then((ok) => setPushState(ok ? "on" : "off"));
  }, [subscribe]);

  const enablePush = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const ok = await subscribe();
        setPushState(ok ? "on" : "off");
      } else {
        setPushState(perm === "denied" ? "denied" : "default");
      }
    } catch {
      setPushState("off");
    } finally {
      setBusy(false);
    }
  };

  const markRead = (id: string | null) => {
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    }).catch(() => {});
  };

  const clickItem = (n: Item) => {
    if (!n.read) {
      markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.section) onNavigate?.(n.section);
  };

  const markAll = () => {
    markRead(null);
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-gray-100 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,22rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline"
              >
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>

          {pushState === "default" && (
            <div className="px-4 py-2.5 bg-violet-50 border-b border-violet-100 text-xs text-violet-900">
              <p>Get alerts on your phone even when the app is closed.</p>
              <button
                type="button"
                disabled={busy}
                onClick={enablePush}
                className="mt-1.5 font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-3 py-1 rounded-lg"
              >
                {busy ? "Please wait..." : "Turn on phone notifications"}
              </button>
            </div>
          )}
          {pushState === "denied" && (
            <p className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
              Phone notifications are blocked. Allow notifications for this site in your browser settings.
            </p>
          )}
          {pushState === "ios-install" && (
            <p className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
              On iPhone: tap Share, then &quot;Add to Home Screen&quot;, and open the app from there to get phone
              notifications.
            </p>
          )}

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => clickItem(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-2.5 ${
                    n.read ? "" : "bg-violet-50/50"
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-violet-600"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 break-words">{n.title}</span>
                    {n.body && (
                      <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2 break-words">{n.body}</span>
                    )}
                    <span className="block text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
