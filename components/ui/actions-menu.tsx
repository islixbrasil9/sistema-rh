"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

type ActionItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
};

type Props = {
  actions: ActionItem[];
};

export function ActionsMenu({ actions }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-slate-700 transition hover:bg-gray-50"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {actions.map((action, index) => {
            const base =
              "flex w-full items-center px-4 py-3 text-sm transition";

            const color = action.danger
              ? "text-red-600 hover:bg-red-50"
              : "text-slate-700 hover:bg-gray-50";

            const disabled =
              action.disabled && "opacity-50 cursor-not-allowed";

            // LINK
            if (action.href && !action.disabled) {
              return (
                <Link
                  key={index}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className={`${base} ${color}`}
                >
                  {action.label}
                </Link>
              );
            }

            // BUTTON
            return (
              <button
                key={index}
                onClick={() => {
                  if (action.disabled) return;
                  setOpen(false);
                  action.onClick?.();
                }}
                className={`${base} ${color} text-left ${disabled}`}
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