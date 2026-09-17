"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn } from "lucide-react";

export default function MemberLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/member/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage(data.message || "Login failed");
    }
  };

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

      <p className="text-sm text-gray-500 text-center mt-4">
        New member?{" "}
        <Link href="/register" className="text-violet-600 font-medium hover:underline">
          Register subscribed account
        </Link>
      </p>
    </div>
  );
}
