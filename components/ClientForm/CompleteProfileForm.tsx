"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormData } from "@/lib/schema";
import { STATE } from "@/lib/locationData";
import { STEP1_FIELDS } from "@/lib/clientBuilder";
import Step1PersonalInfo from "./Step1PersonalInfo";
import Step2LocationInfo from "./Step2LocationInfo";
import LogoutButton from "@/components/Login/LogoutButton";

export default function CompleteProfileForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onChange",
    defaultValues: { state: STATE },
  });

  const goNext = async () => {
    if (await methods.trigger(STEP1_FIELDS)) setStep(2);
  };

  const onSubmit = async (data: ClientFormData) => {
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Could not save your details. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Complete your profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              We now keep your own details on your account. This is a one-time step —
              step {step} of 2.
            </p>
          </div>
          <LogoutButton />
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div key={step} className="animate-fadeInUp">
              {step === 1 && <Step1PersonalInfo />}
              {step === 2 && <Step2LocationInfo />}
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <div className="flex justify-between mt-8">
              {step === 2 ? (
                <button type="button" onClick={() => setStep(1)} className="border border-gray-300 hover:bg-gray-50">
                  Back
                </button>
              ) : (
                <span />
              )}
              {step === 1 ? (
                <button type="button" onClick={goNext} className="bg-violet-600 text-white hover:bg-violet-700">
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={methods.formState.isSubmitting}
                  className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  Save &amp; Continue
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
