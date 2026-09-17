"use client";

import { districts } from "@/lib/locationData";
import { Filter } from "lucide-react";

export type LocationFilter = {
  district: string;
  taluka: string;
  city: string;
};

export const EMPTY_LOCATION_FILTER: LocationFilter = {
  district: "",
  taluka: "",
  city: "",
};

export default function LocationFilterBar({
  value,
  onChange,
}: {
  value: LocationFilter;
  onChange: (v: LocationFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mr-1">
        <Filter size={14} />
        Filter
      </div>

      <select
        value={value.district}
        onChange={(e) => onChange({ ...value, district: e.target.value, taluka: "" })}
        className="text-sm py-1.5"
      >
        <option value="">All Districts</option>
        {districts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <input
        value={value.taluka}
        onChange={(e) => onChange({ ...value, taluka: e.target.value })}
        placeholder="Taluka"
        className="text-sm py-1.5 w-28"
      />

      <input
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        placeholder="City"
        className="text-sm py-1.5 w-32"
      />

      {(value.district || value.taluka || value.city) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_LOCATION_FILTER)}
          className="text-xs text-violet-600 hover:underline py-1"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
