"use client";

import { useState } from "react";
import { Mail, KeyRound, Lock, ArrowLeft } from "lucide-react";

// "Forgot password?" flow for members: email -> 6-digit code -> new password.
export default function ForgotPasswordForm({
  initialEmail = "",
  onDone,
  onCancel,
}: {
  initialEmail?: string;
  onDone: (email: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const post = async (url: string, body: object) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: { message: "Network error. Please try again." } };
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const { ok, data } = await post("/api/auth/member/forgot-password", { email });
    if (ok) {
      setInfo(data.message);
      setStep("reset");
    } else {
      setError(data.message || "Could not send the code");
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("The two passwords don't match");
    const { ok, data } = await post("/api/auth/member/reset-password", { email, otp, password });
    if (ok) onDone(email.trim().toLowerCase());
    else setError(data.message || "Could not change the password");
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-5">
        <p className="text-base font-semibold text-slate-900">Reset your password</p>
        <p className="text-xs text-slate-500 mt-1">
          {step === "email"
            ? "Enter your account email. We'll send you a 6-digit code."
            : info}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Mail size={16} className="text-violet-600" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <KeyRound size={16} className="text-violet-600" /> 6-digit code
            </label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full tracking-[0.4em] font-mono"
              autoFocus
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Lock size={16} className="text-violet-600" /> New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Lock size={16} className="text-violet-600" /> Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              className="w-full"
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || otp.length !== 6 || password.length < 6 || !confirm}
            className="w-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Set new password"}
          </button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={loading}
            className="w-full !py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:underline"
          >
            Didn&apos;t get the code? Send again
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="mt-3 w-full !py-1.5 flex items-center justify-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium hover:underline"
      >
        <ArrowLeft size={13} /> Back to login
      </button>
    </div>
  );
}
