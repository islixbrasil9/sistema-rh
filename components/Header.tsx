"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { LogoutButton } from "./LogoutButton";
import { Bell, Menu, Search, Sparkles } from "lucide-react";

type HeaderProps = {
  onOpenMobileMenu?: () => void;
};

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setEmail(user?.email ?? "");
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? "");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 lg:left-72">
      <div className="px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 transition hover:bg-slate-50 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>

            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg sm:flex">
              <Sparkles size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                Sistema de RH
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Gestão de pessoas e movimentações
              </p>
            </div>
          </div>

          <div className="hidden flex-1 px-6 lg:flex">
            <div className="relative w-full max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 transition hover:bg-slate-50 sm:flex"
            >
              <Bell size={18} />
            </button>

            <div className="hidden text-right md:block">
              <p className="text-xs text-slate-500">Usuário logado</p>
              <p className="max-w-[180px] truncate text-sm font-medium text-slate-800 lg:max-w-[220px]">
                {email || "Carregando..."}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 text-sm font-semibold text-white shadow-md sm:h-11 sm:w-11">
              {email?.[0]?.toUpperCase() || "U"}
            </div>

            <div className="shrink-0">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}