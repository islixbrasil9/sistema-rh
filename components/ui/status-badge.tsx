import { cn } from "@/lib/utils";

type StatusTone =
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "gray"
  | "orange";

const tones = {
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-slate-100 text-slate-700",
  orange: "bg-orange-100 text-orange-700",
};

export function StatusBadge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}