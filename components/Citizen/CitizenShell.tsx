"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, ClipboardList } from "lucide-react";
import LogoutButton from "@/components/Login/LogoutButton";
import ComplaintForm from "@/components/Complaints/ComplaintForm";
import MyComplaints from "@/components/Citizen/MyComplaints";

type Tab = "file" | "mine";

export default function CitizenShell({ email, name }: { email: string | null; name?: string | null }) {
  const [tab, setTab] = useState<Tab>("file");

  useEffect(() => {
    if (email) {
      try {
        localStorage.setItem("citizen_email", email);
        localStorage.setItem("last_portal", "citizen");
      } catch {
        // ignore
      }
    }
  }, [email]);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <header className="flex items-center justify-between px-3 sm:px-6 lg:px-10 py-3 sm:py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-2 text-slate-900 min-w-0">
          <ShieldCheck size={22} className="text-violet-600 shrink-0" />
          <span className="font-bold tracking-tight text-sm sm:text-base truncate">
            CLIENT REGISTRY
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs sm:text-sm text-gray-600 max-w-[120px] sm:max-w-[220px] truncate">
            {name ? name : email}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-lg p-1 mb-5 sm:mb-6">
          <button
            onClick={() => setTab("file")}
            className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium py-2 rounded-md transition-colors ${
              tab === "file" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlertTriangle size={15} />
            <span>Register Complaint</span>
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium py-2 rounded-md transition-colors ${
              tab === "mine" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList size={15} />
            <span>My Complaints</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 animate-fadeIn" key={tab}>
          {tab === "file" ? <ComplaintForm /> : <MyComplaints />}
        </div>
      </main>
    </div>
  );
}
