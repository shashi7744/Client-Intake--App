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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <Filter size={14} />
          Location Filters
        </div>
        {(value.district || value.taluka || value.city) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_LOCATION_FILTER)}
            className="sm:hidden text-xs text-violet-600 hover:underline py-0.5"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 flex-1">
        <select
          value={value.district}
          onChange={(e) => onChange({ ...value, district: e.target.value, taluka: "" })}
          className="text-xs sm:text-sm py-1.5 w-full sm:w-auto flex-1 min-w-[130px]"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-1">
          <input
            value={value.taluka}
            onChange={(e) => onChange({ ...value, taluka: e.target.value })}
            placeholder="Taluka"
            className="text-xs sm:text-sm py-1.5 w-full sm:w-28"
          />

          <input
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="City"
            className="text-xs sm:text-sm py-1.5 w-full sm:w-32"
          />
        </div>

        {(value.district || value.taluka || value.city) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_LOCATION_FILTER)}
            className="hidden sm:inline-block text-xs text-violet-600 hover:underline py-1 px-1 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
