"use client";

import { useEffect, useState } from "react";
import { Inbox, Crown, Users } from "lucide-react";
import Avatar from "@/components/shared/Avatar";

type AdminMember = {
  email: string;
  phone: string | null;
  isPaid: boolean;
  memberSince: string | null;
  createdAt: string;
  clientCount: number;
};

export default function MembersTable() {
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setMembers(data.members);
        else setError(data.message || "Failed to load members");
      })
      .catch(() => setError("Failed to load members"));
  }, []);

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
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
        <Users size={15} className="text-cyan-600" />
        <span className="font-semibold text-slate-900">{members.length}</span>
        {members.length === 1 ? "member" : "members"}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {members.map((m, i) => (
          <div
            key={m.email}
            className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-2.5 animate-fadeInUp"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={m.email} size="md" />
                <p className="font-semibold text-slate-900 text-sm truncate">{m.email}</p>
              </div>
              {m.isPaid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                  <Crown size={10} />
                  Paid
                </span>
              ) : (
                <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Unpaid
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Phone</span>
                <span className="font-medium">{m.phone || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Clients Registered</span>
                <span className="font-medium text-violet-700 font-semibold">{m.clientCount}</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100">
              <span>Joined: {new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              {m.memberSince && <span>Paid: {new Date(m.memberSince).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Clients Registered</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Member Since</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m, i) => (
                <tr
                  key={m.email}
                  className="animate-fadeInUp hover:bg-slate-50 transition-colors"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.email} size="md" />
                      <p className="font-medium text-slate-900">{m.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{m.phone || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {m.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Crown size={11} />
                        Paid Member
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        Not paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                    {m.clientCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                    {m.memberSince
                      ? new Date(m.memberSince).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
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
    </div>
  );
}
