"use client";

import { useFormContext } from "react-hook-form";
import type { ClientFormData } from "@/lib/schema";
import { User, Phone, Users2, Cake, BookUser, Briefcase, MapPin } from "lucide-react";

function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
      <span className="text-violet-600">{icon}</span>
      {children}
    </label>
  );
}

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export default function Step1PersonalInfo() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ClientFormData>();

  const contact = watch("contact");

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel icon={<User size={16} />}>Customer Name</FieldLabel>
        <input {...register("name")} placeholder="Enter customer name" className="w-full" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <FieldLabel icon={<Users2 size={16} />}>Gender</FieldLabel>
        <select {...register("gender")} className="w-full sm:w-48">
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
      </div>

      <div>
        <FieldLabel icon={<Cake size={16} />}>Date of Birth</FieldLabel>
        <div className="flex gap-3">
          <select {...register("dobDay")} className="flex-1">
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select {...register("dobMonth")} className="flex-[1.4]">
            <option value="">Month</option>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select {...register("dobYear")} className="flex-1">
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {(errors.dobDay || errors.dobMonth || errors.dobYear) && (
          <p className="text-red-500 text-xs mt-1">Select a complete date of birth</p>
        )}
      </div>

      <div>
        <FieldLabel icon={<Phone size={16} />}>Mobile Number</FieldLabel>
        <input
          {...register("contact")}
          placeholder="Enter mobile number"
          className="w-full"
          onChange={(e) =>
            setValue("contact", e.target.value.replace(/\D/g, ""), { shouldValidate: true })
          }
        />
        {errors.contact && (
          <p className="text-red-500 text-xs mt-1">{errors.contact.message}</p>
        )}
      </div>

      <div>
        <FieldLabel icon={<BookUser size={16} />}>Reference</FieldLabel>
        <input {...register("reference")} placeholder="Referred by (optional)" className="w-full" />
      </div>

      <div>
        <FieldLabel icon={<Briefcase size={16} />}>Post</FieldLabel>
        <input {...register("post")} placeholder="Enter post" className="w-full" />
        {errors.post && <p className="text-red-500 text-xs mt-1">{errors.post.message}</p>}
      </div>

      <div>
        <FieldLabel icon={<MapPin size={16} />}>Address</FieldLabel>
        <textarea {...register("address")} rows={3} placeholder="Enter full address" className="w-full" />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
        )}
      </div>
    </div>
  );
}
