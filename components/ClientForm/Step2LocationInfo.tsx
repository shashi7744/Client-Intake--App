"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { ClientFormData } from "@/lib/schema";
import { STATE, districts } from "@/lib/locationData";
import { Landmark, Building2, MapPin, Hash, MapPinned } from "lucide-react";

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
      <span className="text-violet-600">{icon}</span>
      {children}
    </label>
  );
}

export default function Step2LocationInfo() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ClientFormData>();

  const selectedDistrict = useWatch({ control, name: "district" });

  // Only Maharashtra is served, so the state is fixed and never shown as a
  // field the user has to fill in.
  useEffect(() => {
    setValue("state", STATE, { shouldValidate: true });
  }, [setValue]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
        <MapPinned size={15} />
        <span>
          State: <span className="font-semibold">{STATE}</span>
        </span>
      </div>

      <div>
        <FieldLabel icon={<Landmark size={16} />}>District</FieldLabel>
        <select
          {...register("district")}
          className="w-full"
          onChange={(e) => {
            setValue("district", e.target.value);
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
        <FieldLabel icon={<Building2 size={16} />}>Taluka</FieldLabel>
        <input
          {...register("taluka")}
          disabled={!selectedDistrict}
          placeholder="Enter taluka"
          className="w-full disabled:bg-gray-100"
        />
        {errors.taluka && <p className="text-red-500 text-xs mt-1">{errors.taluka.message}</p>}
      </div>

      <div>
        <FieldLabel icon={<MapPin size={16} />}>City</FieldLabel>
        <input {...register("city")} placeholder="Enter city" className="w-full" />
        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
      </div>

      <div>
        <FieldLabel icon={<Hash size={16} />}>Ward</FieldLabel>
        <input {...register("ward")} placeholder="Enter ward" className="w-full" />
        {errors.ward && <p className="text-red-500 text-xs mt-1">{errors.ward.message}</p>}
      </div>
    </div>
  );
}
