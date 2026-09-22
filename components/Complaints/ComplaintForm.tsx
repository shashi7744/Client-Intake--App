"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { complaintSchema, ComplaintFormData } from "@/lib/schema";
import { STATE, districts } from "@/lib/locationData";
import {
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  MessageSquareText,
  MapPinned,
} from "lucide-react";

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{children}</label>;
}

export default function ComplaintForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    mode: "onChange",
    defaultValues: { state: STATE, category: "General" },
  });

  const onSubmit = async (data: ComplaintFormData) => {
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 animate-scaleIn">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <p className="text-slate-900 text-lg font-semibold">Complaint submitted</p>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Thanks for reporting this. It will be reviewed shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            reset({ state: STATE, category: "General" });
            setSubmitted(false);
          }}
          className="inline-flex items-center gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
        >
          <PlusCircle size={16} />
          File Another Complaint
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <SectionHeading
          icon={<MessageSquareText size={16} />}
          title="Description"
          subtitle="Describe the issue in detail"
        />

        <textarea
          {...register("description")}
          rows={5}
          placeholder="Describe the issue - e.g. 'Large pothole near the bus stop causing accidents, water leakage on main road, etc.'"
          className="w-full"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100">
        <SectionHeading
          icon={<MapPinned size={16} />}
          title="Where is this happening?"
          subtitle="Helps route your complaint to the right ward office"
        />

        <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mb-4">
          <MapPinned size={15} />
          <span>
            State: <span className="font-semibold">{STATE}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>District</FieldLabel>
            <select
              {...register("district")}
              className="w-full"
              onChange={(e) => {
                setValue("district", e.target.value, { shouldValidate: true });
                setValue("taluka", "");
              }}
            >
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>
            )}
          </div>

          <div>
            <FieldLabel>Taluka</FieldLabel>
            <input
              {...register("taluka")}
              placeholder="Enter taluka"
              className="w-full"
            />
            {errors.taluka && <p className="text-red-500 text-xs mt-1">{errors.taluka.message}</p>}
          </div>

          <div>
            <FieldLabel>City</FieldLabel>
            <input {...register("city")} placeholder="Enter city" className="w-full" />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>Ward</FieldLabel>
          <input {...register("ward")} placeholder="Enter ward" className="w-full sm:w-1/2" />
          {errors.ward && <p className="text-red-500 text-xs mt-1">{errors.ward.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        <AlertTriangle size={16} />
        {isSubmitting ? "Submitting..." : "Submit Complaint"}
      </button>
    </form>
  );
}
