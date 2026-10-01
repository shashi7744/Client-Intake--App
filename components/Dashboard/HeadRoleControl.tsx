"use client";

import { useState } from "react";
import { districts } from "@/lib/locationData";
import HeadBadge from "@/components/shared/HeadBadge";

export type HeadFields = {
  headLevel: "district" | "taluka" | null;
  headDistrict: string | null;
  headTaluka: string | null;
};

// Admin control to make a member District Head / Taluka Head (or clear it).
export default function HeadRoleControl({
  email,
  value,
  onSaved,
}: {
  email: string;
  value: HeadFields;
  onSaved: (v: HeadFields) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState<"none" | "district" | "taluka">(value.headLevel ?? "none");
  const [district, setDistrict] = useState(value.headDistrict ?? "");
  const [taluka, setTaluka] = useState(value.headTaluka ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/set-head", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, level, district, taluka }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      onSaved({
        headLevel: data.headLevel ?? null,
        headDistrict: data.headDistrict ?? null,
        headTaluka: data.headTaluka ?? null,
      });
      setEditing(false);
    } else {
      setError(data.message || "Could not save");
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {value.headLevel && value.headDistrict ? (
          <HeadBadge head={{ level: value.headLevel, district: value.headDistrict, taluka: value.headTaluka }} />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-violet-700 border border-violet-200 hover:bg-violet-50 px-2 py-0.5 rounded-lg"
        >
          {value.headLevel ? "Edit" : "Set head"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 min-w-[190px]" onClick={(e) => e.stopPropagation()}>
      <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="w-full text-xs py-1">
        <option value="none">No area role</option>
        <option value="district">District Head</option>
        <option value="taluka">Taluka Head</option>
      </select>
      {level !== "none" && (
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full text-xs py-1">
          <option value="">Select district</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}
      {level === "taluka" && (
        <input
          value={taluka}
          onChange={(e) => setTaluka(e.target.value)}
          placeholder="Taluka name"
          className="w-full text-xs py-1"
        />
      )}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={saving || (level !== "none" && !district) || (level === "taluka" && !taluka.trim())}
          onClick={save}
          className="text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 px-2.5 py-1 rounded-lg"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError("");
          }}
          className="text-xs border border-gray-300 hover:bg-gray-50 px-2.5 py-1 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
