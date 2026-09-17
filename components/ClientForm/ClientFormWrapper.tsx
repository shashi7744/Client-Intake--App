"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientFormData } from "@/lib/schema";
import { STATE } from "@/lib/locationData";
import Step1PersonalInfo from "./Step1PersonalInfo";
import Step2LocationInfo from "./Step2LocationInfo";
import { CheckCircle2, PlusCircle } from "lucide-react";

const step1Fields: (keyof ClientFormData)[] = [
  "name",
  "gender",
  "dobDay",
  "dobMonth",
  "dobYear",
  "contact",
  "post",
  "address",
];

export default function ClientFormWrapper({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);

  const methods = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onChange",
    defaultValues: {
      state: STATE,
    },
  });

  const goNext = async () => {
    const valid = await methods.trigger(step1Fields);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: ClientFormData) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSubmitted(true);
      onSubmitted?.();
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 animate-scaleIn">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <p className="text-slate-900 text-lg font-semibold">Client entry submitted</p>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          You can add another entry or switch to All Clients to see it.
        </p>
        <button
          type="button"
          onClick={() => {
            methods.reset({ state: STATE });
            setStep(1);
            setSubmitted(false);
          }}
          className="inline-flex items-center gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
        >
          <PlusCircle size={16} />
          Add Another Client
        </button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                step === s
                  ? "bg-violet-600 text-white"
                  : step > s
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            <div className="flex-1">
              <p
                className={`text-xs font-medium ${
                  step === s ? "text-violet-700" : "text-gray-500"
                }`}
              >
                {s === 1 ? "Personal Details" : "Location Details"}
              </p>
              <div
                className={`h-1 rounded mt-1 ${
                  step >= s ? "bg-violet-600" : "bg-gray-200"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div key={step} className="animate-fadeInUp">
          {step === 1 && <Step1PersonalInfo />}
          {step === 2 && <Step2LocationInfo />}
        </div>

        <div className="flex justify-between mt-8">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-gray-300 hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={methods.formState.isSubmitting}
              className="bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Submit
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
