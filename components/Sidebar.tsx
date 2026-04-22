"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  CalendarDays,
  FileWarning,
  Building2,
} from "lucide-react";
import clsx from "clsx";

const menu = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Funcionários",
    href: "/funcionarios",
    icon: Users,
  },
  {
    label: "Movimentações",
    href: "/movimentacoes",
    icon: ArrowLeftRight,
  },
  {
    label: "Férias",
    href: "/ferias",
    icon: CalendarDays,
  },
  {
    label: "Aviso Prévio",
    href: "/aviso-previo",
    icon: FileWarning,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-72">
      <div className="m-4 flex w-full flex-col rounded-3xl border border-white/50 bg-slate-950/90 p-5 text-white shadow-[0_20px_70px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Building2 size={22} />
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white/95">
              SISTEMA RH
            </h2>
            <p className="text-xs text-slate-400">Painel administrativo</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    active
                      ? "bg-white/15"
                      : "bg-white/5 group-hover:bg-white/10"
                  )}
                >
                  <Icon size={18} />
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Ambiente
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            Gestão interna
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Controle de funcionários, férias, movimentações e avisos prévios.
          </p>
        </div>
      </div>
    </aside>
  );
}