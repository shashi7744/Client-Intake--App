"use client";

import { useEffect, useState } from "react";
import { Users, CalendarDays, CalendarClock, MapPinned, UserCheck, ClipboardList, Clock } from "lucide-react";

type ClientLite = { submittedAt: string; district: string };

type Counts = {
  totalClients: number;
  today: number;
  thisWeek: number;
  districtsCovered: number;
};

type AdminCounts = {
  totalMembers: number;
  paidMembers: number;
  totalComplaints: number;
  pendingComplaints: number;
};

export default function DashboardOverview({ isAdmin = false }: { isAdmin?: boolean }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [adminCounts, setAdminCounts] = useState<AdminCounts | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        const clients: ClientLite[] = data.status === "success" ? data.clients : [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

        setCounts({
          totalClients: clients.length,
          today: clients.filter((c) => new Date(c.submittedAt) >= startOfToday).length,
          thisWeek: clients.filter((c) => new Date(c.submittedAt) >= weekAgo).length,
          districtsCovered: new Set(clients.map((c) => c.district)).size,
        });
      });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/complaints").then((r) => r.json()),
    ]).then(([membersRes, complaintsRes]) => {
      const members = membersRes.status === "success" ? membersRes.members : [];
      const complaints = complaintsRes.status === "success" ? complaintsRes.complaints : [];
      setAdminCounts({
        totalMembers: members.length,
        paidMembers: members.filter((m: any) => m.isPaid).length,
        totalComplaints: complaints.length,
        pendingComplaints: complaints.filter((c: any) => c.status === "Pending").length,
      });
    });
  }, [isAdmin]);

  const cards = [
    {
      label: "Total Clients",
      value: counts?.totalClients,
      icon: <Users size={20} />,
      color: "bg-violet-50 text-violet-700",
      bar: "bg-violet-500",
    },
    {
      label: "Added Today",
      value: counts?.today,
      icon: <CalendarClock size={20} />,
      color: "bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
    },
    {
      label: "Added This Week",
      value: counts?.thisWeek,
      icon: <CalendarDays size={20} />,
      color: "bg-sky-50 text-sky-700",
      bar: "bg-sky-500",
    },
    {
      label: "Districts Covered",
      value: counts?.districtsCovered,
      icon: <MapPinned size={20} />,
      color: "bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
    },
  ];

  const adminCards = adminCounts
    ? [
        {
          label: "Paid Members",
          value: `${adminCounts.paidMembers} / ${adminCounts.totalMembers}`,
          icon: <UserCheck size={20} />,
          color: "bg-cyan-50 text-cyan-700",
          bar: "bg-cyan-500",
        },
        {
          label: "Total Complaints",
          value: adminCounts.totalComplaints,
          icon: <ClipboardList size={20} />,
          color: "bg-amber-50 text-amber-700",
          bar: "bg-amber-500",
        },
        {
          label: "Pending Complaints",
          value: adminCounts.pendingComplaints,
          icon: <Clock size={20} />,
          color: "bg-red-50 text-red-700",
          bar: "bg-red-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar}`} />
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {c.value ?? <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-shimmer" />}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-3">
            Admin - System Wide
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {adminCards.map((c) => (
              <div
                key={c.label}
                className="relative overflow-hidden border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar}`} />
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                  {c.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
