"use client";

import { useEffect, useMemo, useState } from "react";
import type { Complaint, ComplaintStatus } from "@/lib/db";
import { Inbox, ImageOff } from "lucide-react";
import LocationFilterBar, {
  LocationFilter,
  EMPTY_LOCATION_FILTER,
} from "@/components/shared/LocationFilterBar";

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
};

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<LocationFilter>(EMPTY_LOCATION_FILTER);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");

  const load = () => {
    fetch("/api/complaints")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setComplaints(data.complaints);
        } else {
          setError(data.message || "Failed to load complaints");
        }
      })
      .catch(() => setError("Failed to load complaints"));
  };

  useEffect(load, []);

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    // Optimistic update
    setComplaints((prev) => prev && prev.map((c) => (c.id === id ? { ...c, status } : c)));
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) load(); // revert by refetching if it failed
  };

  const filtered = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter((c) => {
      if (filter.district && c.district !== filter.district) return false;
      if (filter.taluka && !c.taluka.toLowerCase().includes(filter.taluka.toLowerCase())) return false;
      if (filter.city && !c.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  }, [complaints, filter, statusFilter]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  if (!complaints) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-shimmer"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <LocationFilterBar value={filter} onChange={setFilter} />
      </div>
      <div className="flex gap-2 mb-4 -mt-2">
        {(["Pending", "In Progress", "Resolved"] as ComplaintStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              statusFilter === s ? STATUS_STYLES[s] : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-12 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <Inbox size={22} className="text-red-400" />
          </div>
          <p className="text-sm text-gray-500">No complaints filed yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No complaints match this filter.</p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-3 animate-fadeInUp"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  {c.photo ? (
                    <a href={c.photo} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img
                        src={c.photo}
                        alt={c.category}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                      />
                    </a>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                      <ImageOff size={18} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-900 text-sm leading-tight truncate">
                        {c.category}
                      </p>
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c.id, e.target.value as ComplaintStatus)}
                        className={`text-[11px] font-medium rounded-full border px-2 py-0.5 ${STATUS_STYLES[c.status]}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{c.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <span>{c.city}, {c.taluka}</span>
                  <span>{new Date(c.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                </div>

                {(c.citizenName || c.contact) && (
                  <div className="text-xs text-slate-600 pt-1 border-t border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-slate-900">{c.citizenName || "Citizen"}</span>
                    <span className="text-gray-500">{c.contact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Photo</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Category</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Location</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Contact</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className="animate-fadeInUp hover:bg-slate-50 transition-colors"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <td className="px-4 py-3">
                        {c.photo ? (
                          <a href={c.photo} target="_blank" rel="noopener noreferrer">
                            <img
                              src={c.photo}
                              alt={c.category}
                              className="w-11 h-11 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300">
                            <ImageOff size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{c.category}</td>
                      <td className="px-4 py-3 max-w-xs text-slate-600">{c.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.city}, {c.taluka}, {c.district}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.citizenName && (
                          <p className="text-slate-900 font-medium leading-tight">{c.citizenName}</p>
                        )}
                        <span className={c.citizenName ? "text-xs text-gray-400" : ""}>{c.contact}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={c.status}
                          onChange={(e) => updateStatus(c.id, e.target.value as ComplaintStatus)}
                          className={`text-xs font-medium rounded-full border px-2 py-1 ${STATUS_STYLES[c.status]}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                        {new Date(c.submittedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
