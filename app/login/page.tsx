"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      showToast(`Erro ao fazer login: ${error.message}`, "error");
      return;
    }

    showToast("Login realizado com sucesso.", "success");
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b16]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_30%),linear-gradient(180deg,#07101f_0%,#050913_100%)]" />
      <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-40px] h-[260px] w-[260px] rounded-full border border-blue-500/10" />
      <div className="absolute bottom-[-160px] left-[-10px] h-[320px] w-[320px] rounded-full border border-blue-500/10" />
      <div className="absolute right-[-80px] top-[80px] h-[240px] w-[240px] rounded-full bg-blue-400/5 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <div className="w-full max-w-[560px] rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,24,38,0.98)_0%,rgba(11,16,28,0.98)_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-7">
          <div className="rounded-[22px] bg-[#0b1220] p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-blue-500 to-blue-700 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.30)]"
              >
                <Building2 size={16} />
                Sistema RH
              </button>

              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-[16px] text-sm font-semibold text-white/45 transition hover:text-white/70"
              >
                <ShieldCheck size={16} />
                Acesso seguro
              </button>
            </div>
          </div>

          <div className="px-2 pb-2 pt-7 sm:px-5 sm:pt-8">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-500/20 to-blue-700/20 ring-1 ring-blue-400/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)]">
                  <Building2 size={28} strokeWidth={2.2} />
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-[34px] font-bold tracking-[-0.04em] text-white">
                Bem-vindo!
              </h1>
              <p className="mt-2 text-[15px] leading-6 text-slate-400">
                Digite seu e-mail e senha para acessar o dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-10 space-y-7">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  E-mail
                </label>

                <div className="flex items-center gap-3 border-b border-white/12 px-1 pb-3 focus-within:border-blue-500">
                  <Mail size={18} className="shrink-0 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Informe seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Senha
                </label>

                <div className="flex items-center gap-3 border-b border-white/12 px-1 pb-3 focus-within:border-blue-500">
                  <Lock size={18} className="shrink-0 text-slate-500" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((prev) => !prev)}
                    className="text-blue-400 transition hover:text-blue-300"
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-r from-blue-500 to-blue-700 text-[15px] font-semibold text-white shadow-[0_18px_35px_rgba(37,99,235,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(37,99,235,0.38)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Entrando..." : "Entrar no sistema"}
                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500">
                Sistema interno de uso restrito
              </p>
              <p className="mt-3 text-xs text-slate-600">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}