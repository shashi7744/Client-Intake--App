import { Crown, Shield } from "lucide-react";

export type HeadInfo = {
  level: "district" | "taluka";
  district: string;
  taluka?: string | null;
};

export default function HeadBadge({ head }: { head?: HeadInfo | null }) {
  if (!head) return null;
  const isDistrict = head.level === "district";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border max-w-full ${
        isDistrict
          ? "bg-amber-50 text-amber-800 border-amber-300"
          : "bg-sky-50 text-sky-800 border-sky-300"
      }`}
      title={isDistrict ? `District Head · ${head.district}` : `Taluka Head · ${head.taluka}`}
    >
      {isDistrict ? <Crown size={10} className="shrink-0" /> : <Shield size={10} className="shrink-0" />}
      <span className="truncate">{isDistrict ? `District Head · ${head.district}` : `Taluka Head · ${head.taluka}`}</span>
    </span>
  );
}
