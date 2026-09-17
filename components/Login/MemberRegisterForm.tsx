"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";

export default function MemberRegisterForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/member/send-register-otp", {
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

  const verifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/member/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage(data.message || "Registration failed");
    }
  };

  if (stage === "otp") {
    return (
      <form onSubmit={verifyAndCreate} className="space-y-4 animate-fadeIn">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <ShieldCheck size={16} className="text-violet-600" />
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
          className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <UserPlus size={16} />
          {loading ? "Creating account..." : "Verify & Create Account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStage("details");
            setOtp("");
            setMessage("");
          }}
          className="w-full text-gray-500 text-xs hover:underline"
        >
          Change email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
          <Mail size={16} className="text-violet-600" />
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
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
          className="w-full"
        />
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
          <Lock size={16} className="text-violet-600" />
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full"
        />
      </div>
      {message && <p className="text-red-500 text-sm">{message}</p>}
      <button
        type="submit"
        disabled={loading || !email || !password || !confirmPassword}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? "Sending OTP..." : "Send Verification Code"}
        <ArrowRight size={16} />
      </button>
      <p className="text-xs text-gray-400 text-center">
        You&apos;ll be able to unlock full member access with a one-time payment after signing up.
      </p>
    </form>
  );
}
