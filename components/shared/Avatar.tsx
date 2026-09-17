const PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-teal-100 text-teal-700",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CLASSES: Record<"sm" | "md" | "lg" | "xl", string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = SIZE_CLASSES[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorFor(
        name || "?"
      )} rounded-full flex items-center justify-center font-semibold shrink-0 ring-2 ring-white shadow-sm ${className}`}
      title={name}
    >
      {initialsFor(name || "?")}
    </div>
  );
}
