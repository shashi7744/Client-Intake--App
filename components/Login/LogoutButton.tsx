"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
  const router = useRouter();

  const logout = async () => {
    // Stop phone notifications for this user on this device before leaving.
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          }).catch(() => {});
          await sub.unsubscribe().catch(() => {});
        }
      }
    } catch {
      // never block logout
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(redirectTo);
    router.refresh();
  };

  return (
    // Phones: icon-only round button (same size as the notification bell).
    // Larger screens: compact outlined button with a label.
    <button
      onClick={logout}
      title="Logout"
      aria-label="Logout"
      className="flex items-center justify-center gap-1.5 shrink-0 w-10 h-10 !p-0 !rounded-full sm:w-auto sm:h-9 sm:!px-3 sm:!rounded-lg border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
    >
      <LogOut size={17} strokeWidth={2.25} />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
