"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, ArrowRight, User, CheckCircle2, RefreshCw } from "lucide-react";

export default function CitizenLoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"remembered" | "email" | "otp" | "name">("email");
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("citizen_email");
      if (saved) {
        setRememberedEmail(saved);
        setEmail(saved);
        setStage("remembered");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const continueAsRemembered = async () => {
    if (!rememberedEmail) return;
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/citizen/remembered-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rememberedEmail }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === "success") {
        localStorage.setItem("last_portal", "citizen");
        router.push("/citizen");
        router.refresh();
      } else {
        // If not found in DB, fallback to OTP flow
        setStage("email");
        setMessage(data.message || "Please re-verify with OTP");
      }
    } catch {
      setLoading(false);
      setStage("email");
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/citizen/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
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

    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch("/api/auth/citizen/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok && data.status === "success") {
      try {
        localStorage.setItem("citizen_email", cleanEmail);
        localStorage.setItem("last_portal", "citizen");
      } catch {
        // ignore
      }

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
          Lodge civic complaints across State, District, Taluka, City, and Ward.
        </p>
      </div>

      {/* Remembered Citizen Card */}
      {stage === "remembered" && rememberedEmail && (
        <div className="space-y-4 animate-fadeIn">
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Registered Citizen
              </p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 break-all">
                {rememberedEmail}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              You are registered on this device. Click below to proceed directly without waiting for OTP.
            </p>
          </div>

          {message && <p className="text-red-500 text-sm text-center">{message}</p>}

          <button
            type="button"
            onClick={continueAsRemembered}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <span>Continue to Lodge Complaint</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setMessage("");
              }}
              className="text-xs text-gray-500 hover:text-slate-800 hover:underline"
            >
              Use a different email or re-enter OTP
            </button>
          </div>
        </div>
      )}

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
            New user? Enter your email once — account is remembered on this device.
          </p>

          {rememberedEmail && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStage("remembered")}
                className="text-xs text-amber-700 hover:underline font-medium"
              >
                ← Back to registered account ({rememberedEmail})
              </button>
            </div>
          )}
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
