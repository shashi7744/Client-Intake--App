"use client";

import { useEffect, useState } from "react";
import type { Complaint, ComplaintStatus } from "@/lib/db";
import { Inbox } from "lucide-react";

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Resolved: "bg-green-50 text-green-700",
};

export default function MyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);

  useEffect(() => {
    fetch("/api/complaints/mine")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setComplaints(data.complaints);
      });
  }, []);

  if (!complaints) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-10 animate-fadeIn">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <Inbox size={22} className="text-amber-400" />
        </div>
        <p className="text-sm text-gray-500">You haven&apos;t filed any complaints yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((c, i) => (
        <div
          key={c.id}
          className="border border-gray-200 rounded-lg p-4 animate-fadeInUp"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              {c.photo && (
                <img
                  src={c.photo}
                  alt={c.category}
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                />
              )}
              <div>
                <p className="font-medium text-slate-900">{c.category}</p>
                <p className="text-sm text-gray-600 mt-0.5">{c.description}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {c.city}, {c.taluka}, {c.district} • {new Date(c.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[c.status]}`}
            >
              {c.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
