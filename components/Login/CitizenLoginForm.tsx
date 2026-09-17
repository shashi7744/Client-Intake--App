"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, ArrowRight, User } from "lucide-react";

export default function CitizenLoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "otp" | "name">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/citizen/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage(data.message);
      setStage("otp");
    } else {
      setMessage(data.message || "Failed to send OTP");
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/citizen/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok && data.status === "success") {
      if (data.needsName) {
        setStage("name");
      } else {
        router.push("/citizen");
        router.refresh();
      }
    } else {
      setMessage(data.message || "Verification failed");
    }
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/citizen/set-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);

    if (res.ok) {
      router.push("/citizen");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || "Could not save your name");
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-5">
        <p className="text-sm font-semibold text-amber-900">Citizen / Public Portal</p>
        <p className="text-xs text-amber-700 mt-1">
          Quick email OTP login to lodge civic complaints across State,
          District, Taluka, City, and Ward.
        </p>
      </div>

      {stage === "email" && (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Mail size={16} className="text-amber-600" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full focus:!border-amber-500 focus:!ring-amber-100"
              autoFocus
            />
          </div>
          {message && <p className="text-red-500 text-sm">{message}</p>}
          <button
            type="submit"
            disabled={loading || !email.includes("@")}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP via Email"}
            <ArrowRight size={16} />
          </button>
          <p className="text-xs text-gray-400 text-center">
            New user? Enter your email — account is created automatically.
          </p>
        </form>
      )}

      {stage === "otp" && (
        <form onSubmit={verifyOtp} className="space-y-4 animate-fadeIn">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <ShieldCheck size={16} className="text-amber-600" />
              Enter OTP
            </label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="6-digit OTP"
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">Sent to {email}</p>
          </div>
          {message && (
            <p className={`text-sm ${message.includes("sent") ? "text-gray-500" : "text-red-500"}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("email");
              setOtp("");
              setMessage("");
            }}
            className="w-full text-gray-500 text-xs hover:underline"
          >
            Change email
          </button>
        </form>
      )}

      {stage === "name" && (
        <form onSubmit={saveName} className="space-y-4 animate-fadeIn">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <User size={16} className="text-amber-600" />
              Your Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full focus:!border-amber-500 focus:!ring-amber-100"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Just once — helps us identify your complaints. You won't be asked again.
            </p>
          </div>
          {message && <p className="text-red-500 text-sm">{message}</p>}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
