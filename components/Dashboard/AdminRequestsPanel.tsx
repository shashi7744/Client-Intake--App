"use client";

import { useEffect, useState, useMemo } from "react";
import type { AccessRequest } from "@/lib/db";
import { Check, X, Clock, CheckCircle2, XCircle, Inbox, Search, Bell, ShieldCheck } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  denied: "bg-red-50 text-red-700 border border-red-200",
};

export default function AdminRequestsPanel() {
  const [requests, setRequests] = useState<AccessRequest[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = () => {
    fetch("/api/access-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.allRequests) {
          setRequests(data.allRequests);
        } else {
          setError(data.message || "Failed to load requests");
        }
      })
      .catch(() => setError("Failed to load requests"));
  };

  useEffect(load, []);

  const respond = async (id: string, action: "approve" | "deny") => {
    setBusyId(id);
    // Optimistic update
    setRequests((prev) =>
      prev
        ? prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: action === "approve" ? "approved" : "denied",
                  respondedAt: new Date().toISOString(),
                }
              : r
          )
        : null
    );

    const res = await fetch(`/api/access-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setBusyId(null);
    if (!res.ok) load();
  };

  const pendingCount = requests?.filter((r) => r.status === "pending").length ?? 0;

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchClient = r.clientName.toLowerCase().includes(q);
        const matchRequester = r.requesterEmail.toLowerCase().includes(q);
        const matchOwner = r.ownerEmail.toLowerCase().includes(q);
        if (!matchClient && !matchRequester && !matchOwner) return false;
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  if (!requests) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top filter and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["all", "pending", "approved", "denied"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All Requests" : s}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client or member..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} className="text-violet-600" />
        <span>
          Showing <strong>{filtered.length}</strong> request{filtered.length === 1 ? "" : "s"} across all members. As Admin, you can approve or deny any request.
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-3">
            <Inbox size={22} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No contact requests found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? "Try clearing your search query." : "When members request client phone numbers, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const isPending = r.status === "pending";
            return (
              <div
                key={r.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-xl p-4 transition-all animate-fadeInUp ${
                  isPending
                    ? "border-amber-200 bg-amber-50/40 shadow-sm"
                    : "border-gray-200 bg-white"
                }`}
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{r.clientName}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status === "pending" && <Clock size={11} />}
                      {r.status === "approved" && <CheckCircle2 size={11} />}
                      {r.status === "denied" && <XCircle size={11} />}
                      {r.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>
                      <span className="text-gray-400">Requester:</span>{" "}
                      <span className="font-semibold text-violet-700">{r.requesterEmail}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Registered by (Owner):</span>{" "}
                      <span className="font-medium text-slate-700">{r.ownerEmail}</span>
                    </p>
                  </div>

                  <p className="text-[11px] text-gray-400 pt-0.5">
                    Requested on: {new Date(r.createdAt).toLocaleString()}
                    {r.respondedAt && ` · Responded: ${new Date(r.respondedAt).toLocaleDateString()}`}
                  </p>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => respond(r.id, "deny")}
                        disabled={busyId === r.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium disabled:opacity-50 transition-colors"
                      >
                        <X size={14} />
                        <span>Deny</span>
                      </button>
                      <button
                        onClick={() => respond(r.id, "approve")}
                        disabled={busyId === r.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => respond(r.id, r.status === "approved" ? "deny" : "approve")}
                        disabled={busyId === r.id}
                        className="text-xs text-gray-500 hover:text-slate-800 underline decoration-dotted"
                      >
                        Change to {r.status === "approved" ? "Deny" : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
