"use client";

import { useState } from "react";
import { Phone, Lock, Clock, XCircle, RotateCcw } from "lucide-react";
import type { AccessRequest } from "@/lib/db";

type Status = "own" | "approved" | "pending" | "denied" | "none";

export default function ContactCell({
  clientId,
  contact,
  contactAccess,
  outgoingRequest,
  onRequested,
}: {
  clientId: string;
  contact: string | null;
  contactAccess: boolean;
  outgoingRequest?: AccessRequest;
  onRequested: (clientId: string, request: AccessRequest) => void;
}) {
  const [loading, setLoading] = useState(false);

  const status: Status = contactAccess
    ? "approved"
    : outgoingRequest?.status === "pending"
    ? "pending"
    : outgoingRequest?.status === "denied"
    ? "denied"
    : "none";

  const requestAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (res.ok && data.request) {
        onRequested(clientId, data.request);
      } else if (res.ok && data.status === "approved") {
        onRequested(clientId, {
          id: "self",
          clientId,
          clientName: "",
          requesterEmail: "",
          ownerEmail: "",
          status: "approved",
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "approved" && contact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Phone size={12} className="text-gray-400" />
        {contact}
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
        <Clock size={12} />
        Requested
      </span>
    );
  }

  if (status === "denied") {
    return (
      <button
        type="button"
        onClick={requestAccess}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        <XCircle size={12} />
        Denied
        <RotateCcw size={11} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={requestAccess}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 px-2.5 py-1.5 disabled:opacity-50"
    >
      <Lock size={12} />
      {loading ? "Requesting..." : "Request number"}
    </button>
  );
}
