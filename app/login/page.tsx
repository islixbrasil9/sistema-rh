"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Lock,
  Mail,
  Shield,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
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
    <div className="min-h-screen bg-[#eef2fb]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#020617_0%,#03113d_42%,#020922_100%)] px-8 py-10 text-white lg:flex lg:flex-col xl:px-10">
          <div className="absolute inset-0">
            <div className="absolute left-[56%] top-[18%] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.24)_0%,rgba(37,99,235,0.08)_38%,rgba(37,99,235,0.00)_72%)]" />
            <div className="absolute left-[80%] top-[36%] h-[260px] w-[260px] rounded-full border border-blue-500/20" />
            <div className="absolute bottom-[-120px] left-[20%] h-[300px] w-[300px] rounded-full border border-blue-400/10" />
            <div className="absolute bottom-[-145px] left-[18%] h-[350px] w-[350px] rounded-full border border-blue-400/10" />
            <div className="absolute bottom-[-170px] left-[16%] h-[400px] w-[400px] rounded-full border border-blue-400/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_26%)]" />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2d6cff_0%,#2155f3_100%)] shadow-[0_14px_28px_rgba(37,99,235,0.25)]">
              <Building2 size={26} strokeWidth={2.3} />
            </div>

            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.02em]">
                Sistema RH
              </h1>
              <p className="mt-0.5 text-[13px] text-white/78">
                Controle interno de pessoal
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-[470px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
              <Sparkles size={15} className="text-blue-400" />
              Plataforma interna de gestão
            </div>

            <h2 className="text-[34px] font-extrabold leading-[1.06] tracking-[-0.04em] xl:text-[40px]">
              Gestão de pessoas
              <br />
              com mais organização
              <br />e{" "}
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                segurança.
              </span>
            </h2>

            <p className="mt-4 max-w-[440px] text-[14px] leading-[1.65] text-white/76 xl:text-[15px]">
              Centralize funcionários, férias, aviso prévio, movimentações e
              documentos em um único ambiente profissional.
            </p>

            <div className="mt-8 grid gap-3">
              <FeatureItem
                icon={<Shield size={19} />}
                titulo="Seguro"
                descricao="Dados protegidos com alta segurança"
              />

              <FeatureItem
                icon={<Users size={19} />}
                titulo="Completo"
                descricao="Todas as informações em um só lugar"
              />

              <FeatureItem
                icon={<BarChart3 size={19} />}
                titulo="Eficiente"
                descricao="Processos rápidos e inteligentes"
              />
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden px-6 py-8 lg:px-8 xl:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f3f6fc_0%,#eef3fb_100%)]" />
          <div className="absolute right-[10%] top-[10%] h-24 w-40 bg-[radial-gradient(circle,rgba(59,130,246,0.10)_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
          <div className="absolute right-[18%] top-[28%] h-40 w-40 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="absolute bottom-[-140px] right-[-30px] h-[380px] w-[380px] rounded-full border border-slate-300/35" />
          <div className="absolute bottom-[-165px] right-[-5px] h-[440px] w-[440px] rounded-full border border-slate-300/20" />

          <div className="relative z-10 w-full max-w-[560px]">
            <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_100%)] px-8 py-8 shadow-[0_25px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80 backdrop-blur-xl lg:px-10 lg:py-9">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 shadow-inner">
                    <Lock size={28} strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-[28px] font-bold tracking-[-0.03em] text-slate-900">
                  Acesso ao sistema
                </h2>
                <p className="mt-2 text-[14px] leading-6 text-slate-500">
                  Entre com seu e-mail e senha para continuar.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <FieldLabel label="E-mail" />
                  <InputShell>
                    <Mail size={19} className="text-slate-400" />
                    <input
                      type="email"
                      placeholder="seuemail@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </InputShell>
                </div>

                <div>
                  <FieldLabel label="Senha" />
                  <InputShell>
                    <Lock size={19} className="text-slate-400" />
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((prev) => !prev)}
                      className="text-slate-400 transition hover:text-slate-600"
                    >
                      {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </InputShell>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={lembrar}
                      onChange={(e) => setLembrar(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Lembrar meu acesso
                  </label>

                  <button
                    type="button"
                    className="text-[14px] font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {loading ? "Entrando..." : "Entrar"}
                  {!loading && (
                    <ArrowRight
                      size={19}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  )}
                </button>
              </form>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
              <LockKeyhole size={15} />
              Sistema interno de uso restrito.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  titulo,
  descricao,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-2.5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {icon}
      </div>

      <div>
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-white">
          {titulo}
        </p>
        <p className="mt-0.5 text-[12.5px] text-white/70">{descricao}</p>
      </div>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="mb-2 block text-[15px] font-semibold text-slate-900">
      {label}
    </label>
  );
}

function InputShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
      {children}
    </div>
  );
}