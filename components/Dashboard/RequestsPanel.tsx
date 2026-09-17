"use client";

import { useEffect, useState } from "react";
import type { AccessRequest } from "@/lib/db";
import { Check, X, Clock, CheckCircle2, XCircle, Inbox } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  denied: "bg-red-50 text-red-700",
};

export default function RequestsPanel() {
  const [tab, setTab] = useState<"incoming" | "sent">("incoming");
  const [incoming, setIncoming] = useState<AccessRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<AccessRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/access-requests")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setIncoming(data.incoming);
          setOutgoing(data.outgoing);
        }
      });
  };

  useEffect(load, []);

  const respond = async (id: string, action: "approve" | "deny") => {
    setBusyId(id);
    await fetch(`/api/access-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    load();
  };

  const pendingIncoming = incoming?.filter((r) => r.status === "pending") ?? [];
  const decidedIncoming = incoming?.filter((r) => r.status !== "pending") ?? [];

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(["incoming", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-500 hover:text-slate-700"
            }`}
          >
            {t === "incoming" ? "Incoming Requests" : "Sent by You"}
            {t === "incoming" && pendingIncoming.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                {pendingIncoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "incoming" && (
        <div className="space-y-2">
          {incoming === null ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : incoming.length === 0 ? (
            <EmptyState text="No one has requested a client's phone number yet." />
          ) : (
            <>
              {pendingIncoming.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border border-amber-200 bg-amber-50/50 rounded-lg px-4 py-3 animate-fadeInUp"
                >
                  <div>
                    <p className="text-sm text-slate-900">
                      <span className="font-semibold">{r.requesterEmail}</span> wants to call{" "}
                      <span className="font-semibold">{r.clientName}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => respond(r.id, "deny")}
                      disabled={busyId === r.id}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Deny"
                    >
                      <X size={15} />
                    </button>
                    <button
                      onClick={() => respond(r.id, "approve")}
                      disabled={busyId === r.id}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      aria-label="Approve"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {decidedIncoming.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-3"
                >
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">{r.requesterEmail}</span> asked about{" "}
                    <span className="font-medium">{r.clientName}</span>
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-2">
          {outgoing === null ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : outgoing.length === 0 ? (
            <EmptyState text="You haven't requested any client's phone number yet." />
          ) : (
            outgoing.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm text-slate-900 font-medium">{r.clientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Requested from {r.ownerEmail} • {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}
                >
                  {r.status === "pending" && <Clock size={11} />}
                  {r.status === "approved" && <CheckCircle2 size={11} />}
                  {r.status === "denied" && <XCircle size={11} />}
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
        <Inbox size={20} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
