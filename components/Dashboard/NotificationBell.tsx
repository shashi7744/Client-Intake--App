"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { AccessRequest } from "@/lib/db";

const POLL_MS = 20000;

export default function NotificationBell({ onOpenRequests }: { onOpenRequests: () => void }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch("/api/access-requests")
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || data.status !== "success") return;
          const incoming = data.incoming as AccessRequest[];
          setPendingCount(incoming.filter((r) => r.status === "pending").length);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onOpenRequests}
      className="relative w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-gray-100 hover:text-slate-700 transition-colors"
      aria-label="Access requests"
    >
      <Bell size={18} />
      {pendingCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </button>
  );
}
