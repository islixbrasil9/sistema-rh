"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";

type ActionItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
};

type Props = {
  actions: ActionItem[];
  className?: string;
  align?: "left" | "right";
  buttonClassName?: string;
  menuClassName?: string;
};

export function ActionsMenu({
  actions,
  className,
  align = "right",
  buttonClassName,
  menuClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={clsx("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          "flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-slate-700 transition hover:bg-gray-50",
          className?.includes("w-full") && "w-full",
          buttonClassName
        )}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          className={clsx(
            "absolute z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg",
            align === "right" ? "right-0" : "left-0",
            menuClassName
          )}
          role="menu"
        >
          {actions.map((action, index) => {
            const baseClass =
              "flex w-full items-center px-4 py-3 text-sm text-left transition";

            const colorClass = action.danger
              ? "text-red-600 hover:bg-red-50"
              : "text-slate-700 hover:bg-gray-50";

            const disabledClass = action.disabled
              ? "cursor-not-allowed opacity-50"
              : "";

            if (action.href && !action.disabled) {
              return (
                <Link
                  key={`${action.label}-${index}`}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className={clsx(baseClass, colorClass)}
                  role="menuitem"
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={() => {
                  if (action.disabled) return;
                  setOpen(false);
                  action.onClick?.();
                }}
                disabled={action.disabled}
                className={clsx(baseClass, colorClass, disabledClass)}
                role="menuitem"
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}