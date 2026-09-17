export type HeroAccent = "indigo" | "emerald" | "violet" | "amber";

const ACCENT_CLASSES: Record<HeroAccent, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
};

export default function SectionHero({
  icon,
  title,
  subtitle,
  accent = "indigo",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: HeroAccent;
}) {
  return (
    <div
      className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 animate-fadeInUp"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ACCENT_CLASSES[accent]}`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
