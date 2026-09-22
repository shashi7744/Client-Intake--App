"use client";

import { useEffect, useState } from "react";
import { Inbox, Users, ChevronDown, ChevronUp, Phone, MapPin, Calendar, User } from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import type { ClientRecord } from "@/lib/db";

type AdminMember = {
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  clientCount: number;
  clients: ClientRecord[];
};

export default function MembersTable() {
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setMembers(data.members);
        else setError(data.message || "Failed to load members");
      })
      .catch(() => setError("Failed to load members"));
  }, []);

  const toggleExpand = (email: string) => {
    setExpandedMember((prev) => (prev === email ? null : email));
  };

  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  if (!members) {
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

  if (members.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-3">
          <Inbox size={22} className="text-cyan-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">No members have signed up yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-violet-600" />
          <span className="font-semibold text-slate-900">{members.length}</span>
          {members.length === 1 ? "member" : "members"}
        </div>
        <p className="text-xs text-gray-500">
          Click on a member to view all client details registered by them
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {members.map((m, i) => {
          const isExpanded = expandedMember === m.email;
          return (
            <div
              key={m.email}
              className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2.5 animate-fadeInUp"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={m.email} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{m.email}</p>
                    {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(m.email)}
                  className="flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                >
                  <span>{m.clientCount} clients</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 flex items-center justify-between">
                <span>Joined: {new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>

              {/* Mobile Expanded Clients List */}
              {isExpanded && (
                <div className="pt-2 border-t border-gray-100 space-y-2 animate-fadeIn">
                  <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <User size={12} className="text-violet-600" />
                    Clients Registered ({m.clients.length}):
                  </h4>

                  {m.clients.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      No clients registered by this member yet.
                    </p>
                  ) : (
                    m.clients.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{c.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {c.gender}, {c.age} yrs
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone size={11} className="text-emerald-600" />
                          <span>{c.contact}</span>
                          {c.post && (
                            <span className="text-[10px] text-violet-700 bg-violet-100 px-1 rounded ml-1">
                              {c.post}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-start gap-1">
                          <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {c.address}, {c.city}, {c.taluka}, {c.district}, Ward: {c.ward}
                          </span>
                        </div>
                        <div className="text-gray-400 text-[10px] flex items-center gap-1 pt-1">
                          <Calendar size={10} />
                          <span>Registered: {new Date(c.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Member Email</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Clients Registered</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Joined</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m, i) => {
                const isExpanded = expandedMember === m.email;
                return (
                  <tr key={m.email} className="contents">
                    <tr
                      onClick={() => toggleExpand(m.email)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? "bg-violet-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.email} size="md" />
                          <div>
                            <p className="font-semibold text-slate-900">{m.email}</p>
                            {m.role === "admin" && (
                              <span className="text-[10px] uppercase font-bold text-violet-600 bg-violet-100 px-1.5 py-0.2 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {m.phone || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
                          <User size={12} />
                          {m.clientCount} {m.clientCount === 1 ? "client" : "clients"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                        {new Date(m.createdAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(m.email);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-white border border-violet-200 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <span>{isExpanded ? "Hide Clients" : "View Clients"}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Client Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={5} className="px-6 py-4 border-t border-b border-violet-100">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                All Clients Registered by {m.email} ({m.clients.length})
                              </h4>
                            </div>

                            {m.clients.length === 0 ? (
                              <p className="text-xs text-gray-500 italic py-2">
                                This member has not registered any clients yet.
                              </p>
                            ) : (
                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <table className="min-w-full text-xs">
                                  <thead className="bg-slate-100 text-slate-600 text-left font-semibold">
                                    <tr>
                                      <th className="px-3 py-2">Client Name</th>
                                      <th className="px-3 py-2">Contact Number</th>
                                      <th className="px-3 py-2">Gender & Age</th>
                                      <th className="px-3 py-2">Post</th>
                                      <th className="px-3 py-2">Address & Location</th>
                                      <th className="px-3 py-2">Registered At</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {m.clients.map((c) => (
                                      <tr key={c.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-semibold text-slate-900">
                                          {c.name}
                                        </td>
                                        <td className="px-3 py-2 font-mono font-medium text-emerald-700">
                                          {c.contact}
                                        </td>
                                        <td className="px-3 py-2 text-slate-600">
                                          {c.gender}, {c.age} yrs
                                        </td>
                                        <td className="px-3 py-2 text-slate-700">
                                          <span className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                            {c.post}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-600 max-w-xs">
                                          {c.address}, {c.city}, {c.taluka}, {c.district}, Ward: {c.ward}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
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
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
