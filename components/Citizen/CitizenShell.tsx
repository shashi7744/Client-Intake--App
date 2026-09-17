"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, ClipboardList } from "lucide-react";
import LogoutButton from "@/components/Login/LogoutButton";
import ComplaintForm from "@/components/Complaints/ComplaintForm";
import MyComplaints from "@/components/Citizen/MyComplaints";

type Tab = "file" | "mine";

export default function CitizenShell({ email, name }: { email: string | null; name?: string | null }) {
  const [tab, setTab] = useState<Tab>("file");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 sm:px-10 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck size={22} className="text-violet-600" />
          <span className="font-bold tracking-tight">CLIENT &amp; COMPLAINT REGISTRY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {name ? (
              <>
                {name} <span className="text-gray-400">· {email}</span>
              </>
            ) : (
              email
            )}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab("file")}
            className={`flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
              tab === "file" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlertTriangle size={16} />
            Register Complaint
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
              tab === "mine" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList size={16} />
            My Complaints
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-fadeIn" key={tab}>
          {tab === "file" ? <ComplaintForm /> : <MyComplaints />}
        </div>
      </main>
    </div>
  );
}
