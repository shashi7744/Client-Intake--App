"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import { clientSchema, ClientFormData } from "@/lib/schema";
import { STATE } from "@/lib/locationData";
import { STEP1_FIELDS } from "@/lib/clientBuilder";
import Step1PersonalInfo from "@/components/ClientForm/Step1PersonalInfo";
import Step2LocationInfo from "@/components/ClientForm/Step2LocationInfo";

type Stage = "account" | "personal" | "location" | "otp";

export default function MemberRegisterForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onChange",
    defaultValues: { state: STATE },
  });

  const nextFromAccount = () => {
    setMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage("Enter a valid email address");
    if (password.length < 6) return setMessage("Password must be at least 6 characters");
    if (password !== confirmPassword) return setMessage("Passwords do not match");
    setStage("personal");
  };

  const nextFromPersonal = async () => {
    if (await methods.trigger(STEP1_FIELDS)) setStage("location");
  };

  const sendOtp = async () => {
    setMessage("");
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
      body: JSON.stringify({ email, password, otp, client: methods.getValues() }),
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

  const stages: Stage[] = ["account", "personal", "location", "otp"];
  const labels = ["Account", "Personal", "Location", "Verify"];
  const idx = stages.indexOf(stage);
  const btn = "flex items-center justify-center gap-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50";

  return (
    <FormProvider {...methods}>
      <div className="flex items-center gap-2 mb-6">
        {labels.map((l, i) => (
          <div key={l} className="flex-1">
            <p className={`text-[11px] font-medium ${i === idx ? "text-violet-700" : "text-gray-500"}`}>{l}</p>
            <div className={`h-1 rounded mt-1 ${i <= idx ? "bg-violet-600" : "bg-gray-200"}`} />
          </div>
        ))}
      </div>

      {stage === "account" && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Mail size={16} className="text-violet-600" /> Email Address
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" autoFocus />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Lock size={16} className="text-violet-600" /> Password
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Lock size={16} className="text-violet-600" /> Confirm Password
            </label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full" />
          </div>
          {message && <p className="text-red-500 text-sm">{message}</p>}
          <button type="button" onClick={nextFromAccount} disabled={!email || !password || !confirmPassword} className={`w-full ${btn}`}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}

      {stage === "personal" && (
        <div className="animate-fadeIn">
          <Step1PersonalInfo />
          <div className="flex justify-between mt-6">
            <button type="button" onClick={() => setStage("account")} className="border border-gray-300 hover:bg-gray-50">Back</button>
            <button type="button" onClick={nextFromPersonal} className={btn}>Next</button>
          </div>
        </div>
      )}

      {stage === "location" && (
        <div className="animate-fadeIn">
          <Step2LocationInfo />
          {message && <p className="text-red-500 text-sm mt-4">{message}</p>}
          <div className="flex justify-between mt-6">
            <button type="button" onClick={() => setStage("personal")} className="border border-gray-300 hover:bg-gray-50">Back</button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (await methods.trigger()) sendOtp();
              }}
              className={btn}
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </div>
        </div>
      )}

      {stage === "otp" && (
        <form onSubmit={verifyAndCreate} className="space-y-4 animate-fadeIn">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <ShieldCheck size={16} className="text-violet-600" /> Enter OTP
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
            <p className={`text-sm ${message.includes("sent") ? "text-gray-500" : "text-red-500"}`}>{message}</p>
          )}
          <button type="submit" disabled={loading || otp.length !== 6} className={`w-full ${btn}`}>
            <UserPlus size={16} />
            {loading ? "Creating account..." : "Verify & Create Account"}
          </button>
          <button
            type="button"
            onClick={() => { setStage("location"); setOtp(""); setMessage(""); }}
            className="w-full text-gray-500 text-xs hover:underline"
          >
            Back
          </button>
        </form>
      )}
    </FormProvider>
  );
}
