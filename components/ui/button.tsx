import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "success"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

function getVariantClasses(variant: ButtonVariant) {
  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
    secondary:
      "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100",
    danger:
      "bg-red-600 text-white hover:bg-red-500 shadow-sm",
  };

  return variants[variant];
}

function getSizeClasses(size: ButtonSize) {
  const sizes = {
    sm: "h-9 px-3 text-sm rounded-xl",
    md: "h-11 px-4 text-sm rounded-2xl",
    lg: "h-12 px-5 text-base rounded-2xl",
  };

  return sizes[size];
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  href,
  ...props
}: ButtonAsButton | ButtonAsLink) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    getVariantClasses(variant),
    getSizeClasses(size),
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}