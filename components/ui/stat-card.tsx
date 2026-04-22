import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

type Tone = "default" | "green" | "blue" | "amber" | "orange" | "gray";

const styles = {
  default: {
    wrap: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-600",
  },
  green: {
    wrap: "border-green-100 bg-green-50/50",
    icon: "bg-green-100 text-green-700",
  },
  blue: {
    wrap: "border-blue-100 bg-blue-50/50",
    icon: "bg-blue-100 text-blue-700",
  },
  amber: {
    wrap: "border-amber-100 bg-amber-50/50",
    icon: "bg-amber-100 text-amber-700",
  },
  orange: {
    wrap: "border-orange-100 bg-orange-50/50",
    icon: "bg-orange-100 text-orange-700",
  },
  gray: {
    wrap: "border-slate-200 bg-slate-50/70",
    icon: "bg-slate-200 text-slate-700",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card className={cn("p-4 sm:p-5 lg:p-6", styles[tone].wrap)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:mt-3 lg:text-5xl">
            {value}
          </p>

          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500 sm:mt-2">{subtitle}</p>
          ) : null}
        </div>

        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11",
              styles[tone].icon
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}