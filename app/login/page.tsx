"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, AlertTriangle } from "lucide-react";
import MemberLoginForm from "@/components/Login/MemberLoginForm";
import CitizenLoginForm from "@/components/Login/CitizenLoginForm";

type Tab = "member" | "citizen";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("member");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "citizen") {
        setTab("citizen");
      } else if (localStorage.getItem("last_portal") === "citizen") {
        setTab("citizen");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem("last_portal", t);
    } catch {
      // ignore
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 bg-slate-50 overflow-hidden py-10">
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-violet-300/40 rounded-full blur-3xl animate-blob" />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-amber-300/30 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative w-full max-w-md animate-fadeInUp">
        <div className="flex items-center justify-center gap-2 mb-6 text-slate-900">
          <ShieldCheck size={26} className="text-violet-600" />
          <span className="font-bold text-lg tracking-tight">CLIENT &amp; COMPLAINT REGISTRY</span>
        </div>

        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-semibold mb-1 text-center text-slate-900">Welcome</h1>
          <p className="text-sm text-gray-500 mb-5 text-center">
            Select your login method to access your dashboard
          </p>

          <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-lg p-1 mb-5">
            <button
              onClick={() => handleTabChange("member")}
              className={`flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
                tab === "member"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <UserCheck size={16} />
              Member Login
            </button>
            <button
              onClick={() => handleTabChange("citizen")}
              className={`flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
                tab === "citizen"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <AlertTriangle size={16} />
              Citizen Complaint
            </button>
          </div>

          {tab === "member" ? <MemberLoginForm /> : <CitizenLoginForm />}
        </div>
      </div>
    </main>
  );
}
