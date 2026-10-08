"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { usePushNotifications } from "@/lib/usePushNotifications";

const DISMISS_KEY = "push_prompt_dismissed";

// One-time card shown on phones after login, asking to turn on phone
// notifications. Hidden on PCs, once enabled/blocked, or after "Not now"
// (the same button stays available inside the bell).
export default function PushPromptCard({ message }: { message: string }) {
  const { state, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (dismissed || (state !== "default" && state !== "ios-install")) return null;

  return (
    <div className="relative mb-4 sm:mb-6 flex gap-3 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm animate-fadeIn">
      <div className="w-10 h-10 shrink-0 rounded-full bg-violet-600 text-white flex items-center justify-center">
        <BellRing size={19} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1 pr-6">
        <p className="font-semibold text-slate-900 text-sm">Get alerts on your phone</p>
        {state === "ios-install" ? (
          <p className="text-xs text-slate-600 mt-1">
            On iPhone: tap the Share button, then &quot;Add to Home Screen&quot;. Open the app from that icon to turn
            on alerts.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-600 mt-1">{message}</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={enable}
                disabled={busy}
                className="!px-3.5 !py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              >
                {busy ? "Please wait..." : "Turn on"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="!px-3 !py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 !p-1.5 !rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
