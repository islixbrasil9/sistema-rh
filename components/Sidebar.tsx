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
  X,
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

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleLinkClick() {
    if (onClose) onClose();
  }

  return (
    <>
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
              const active = isActive(item.href);

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

      <div
        className={clsx(
          "fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-[2px] transition-all duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-[70] w-[86%] max-w-[320px] transform transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="m-3 flex h-[calc(100vh-24px)] flex-col rounded-3xl border border-white/50 bg-slate-950/95 p-4 text-white shadow-[0_20px_70px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Building2 size={20} />
              </div>

              <div>
                <h2 className="text-sm font-semibold tracking-wide text-white/95">
                  SISTEMA RH
                </h2>
                <p className="text-xs text-slate-400">Painel administrativo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={clsx(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all",
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

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
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
    </>
  );
}