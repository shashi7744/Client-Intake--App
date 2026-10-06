"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, CheckCircle2, ArrowRight } from "lucide-react";

export default function MemberLoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"remembered" | "form">("form");
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("member_email");
      if (saved) {
        setRememberedEmail(saved);
        setEmail(saved);
        setStage("remembered");
      }
    } catch {
      // ignore
    }
  }, []);

  const continueAsRemembered = async () => {
    if (!rememberedEmail) return;
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/member/remembered-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rememberedEmail }),
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (res.ok && data.status === "success") {
        try {
          localStorage.setItem("last_portal", "member");
          localStorage.setItem("member_email", rememberedEmail);
        } catch {
          // ignore
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        setStage("form");
        setMessage(data.message || "Please enter your password to proceed.");
      }
    } catch {
      setLoading(false);
      setStage("form");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    let res: Response;
    try {
      res = await fetch("/api/auth/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setLoading(false);
      setMessage("Network error connecting to login service. Please try again.");
      return;
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { message: `Server error (${res.status})` };
    }
    setLoading(false);

    if (res.ok) {
      try {
        localStorage.setItem("member_email", email.trim().toLowerCase());
        localStorage.setItem("last_portal", "member");
      } catch {
        // ignore
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage(data.message || "Login failed");
    }
  };

  if (stage === "remembered" && rememberedEmail) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center mb-5">
          <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Registered Member
          </p>
          <p className="font-bold text-slate-900 text-base break-all mb-2">
            {rememberedEmail}
          </p>
          <p className="text-xs text-slate-600">
            You are registered on this device. Click below to proceed directly to your dashboard.
          </p>
        </div>

        {message && <p className="text-red-500 text-sm mb-4 text-center">{message}</p>}

        <button
          onClick={continueAsRemembered}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm flex items-center justify-center gap-2 transition-all mb-4 disabled:opacity-50"
        >
          <span>{loading ? "Opening Dashboard..." : "Continue to Dashboard"}</span>
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setStage("form");
          }}
          className="text-xs text-slate-500 hover:text-slate-800 text-center block w-full py-2 hover:underline"
        >
          Use a different email or log in with password
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 mb-5">
        <p className="text-sm font-semibold text-violet-900">Subscribed Member Portal</p>
        <p className="text-xs text-violet-700 mt-1">
          Access client intake registration, location breakdowns
          (State/District/Taluka/City/Ward), and complaint records.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <Mail size={16} className="text-violet-600" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="w-full"
            autoFocus
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <Lock size={16} className="text-violet-600" />
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full"
          />
        </div>
        {message && <p className="text-red-500 text-sm">{message}</p>}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <LogIn size={16} />
          {loading ? "Signing in..." : "Sign In as Member"}
        </button>
      </form>

      {rememberedEmail && (
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setStage("remembered");
          }}
          className="text-xs text-violet-600 hover:text-violet-800 font-medium text-center block w-full mt-4 hover:underline"
        >
          ← Back to registered account ({rememberedEmail})
        </button>
      )}

      <p className="text-sm text-gray-500 text-center mt-4">
        New member?{" "}
        <Link href="/register" className="text-violet-600 font-medium hover:underline">
          Register subscribed account
        </Link>
      </p>
    </div>
  );
}
