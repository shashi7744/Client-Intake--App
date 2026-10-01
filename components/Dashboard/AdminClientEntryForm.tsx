"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormData } from "@/lib/schema";
import { STATE } from "@/lib/locationData";
import { STEP1_FIELDS } from "@/lib/clientBuilder";
import Step1PersonalInfo from "@/components/ClientForm/Step1PersonalInfo";
import Step2LocationInfo from "@/components/ClientForm/Step2LocationInfo";
import { Mail, Lock, CheckCircle2, PlusCircle } from "lucide-react";

type Stage = "account" | "personal" | "location";

export default function AdminClientEntryForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [stage, setStage] = useState<Stage>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onChange",
    defaultValues: { state: STATE },
  });

  const reset = () => {
    methods.reset({ state: STATE });
    setEmail("");
    setPassword("");
    setMessage("");
    setStage("account");
    setDone(false);
  };

  const nextFromAccount = () => {
    setMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage("Enter a valid email address");
    if (password.length < 6) return setMessage("Password must be at least 6 characters");
    setStage("personal");
  };

  const nextFromPersonal = async () => {
    if (await methods.trigger(STEP1_FIELDS)) setStage("location");
  };

  const onSubmit = async (data: ClientFormData) => {
    setMessage("");
    setLoading(true);
    const res = await fetch("/api/admin/create-client-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, client: data }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setDone(true);
      onSubmitted?.();
    } else {
      setMessage(json.message || "Could not create entry");
      if (res.status === 409) setStage("account");
    }
  };

  if (done) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <p className="text-slate-900 text-lg font-semibold">Client entry created</p>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {email} can now log in with the password you set.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
        >
          <PlusCircle size={16} />
          Add Another
        </button>
      </div>
    );
  }

  const stages: Stage[] = ["account", "personal", "location"];
  const labels = ["Account", "Personal", "Location"];
  const idx = stages.indexOf(stage);

  return (
    <FormProvider {...methods}>
      <div className="flex items-center gap-3 mb-8">
        {labels.map((l, i) => (
          <div key={l} className="flex-1">
            <p className={`text-xs font-medium ${i === idx ? "text-violet-700" : "text-gray-500"}`}>{l}</p>
            <div className={`h-1 rounded mt-1 ${i <= idx ? "bg-violet-600" : "bg-gray-200"}`} />
          </div>
        ))}
      </div>

      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div key={stage} className="animate-fadeInUp">
          {stage === "account" && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <Mail size={16} className="text-violet-600" /> Member Email
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" className="w-full" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <Lock size={16} className="text-violet-600" /> Password
                </label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full" autoComplete="off" />
                <p className="text-xs text-gray-400 mt-1">No OTP needed for admin-created entries. Share this password with the member.</p>
              </div>
            </div>
          )}
          {stage === "personal" && <Step1PersonalInfo />}
          {stage === "location" && <Step2LocationInfo />}
        </div>

        {message && <p className="text-red-500 text-sm mt-4">{message}</p>}

        <div className="flex justify-between mt-8">
          {stage !== "account" ? (
            <button type="button" onClick={() => setStage(stage === "location" ? "personal" : "account")} className="border border-gray-300 hover:bg-gray-50">
              Back
            </button>
          ) : (
            <span />
          )}
          {stage === "account" && (
            <button type="button" onClick={nextFromAccount} className="bg-violet-600 text-white hover:bg-violet-700">Next</button>
          )}
          {stage === "personal" && (
            <button type="button" onClick={nextFromPersonal} className="bg-violet-600 text-white hover:bg-violet-700">Next</button>
          )}
          {stage === "location" && (
            <button type="submit" disabled={loading} className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
              {loading ? "Creating..." : "Create Entry"}
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
