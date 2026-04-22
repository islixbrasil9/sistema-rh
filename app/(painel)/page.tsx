"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  UserPlus,
  ClipboardPlus,
  Users,
  Briefcase,
  ArrowRightLeft,
  UserCircle2,
  FileBarChart2,
  CheckCircle2,
  Plane,
  ShieldAlert,
  PauseCircle,
  UserX,
  BellRing,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type Funcionario = {
  id: string;
  nome: string;
  cargo: string;
  situacao: string;
  admissao: string;
};

type Movimentacao = {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  tipo: string;
  descricao: string;
  data: string;
};

const situacaoColors: Record<string, string> = {
  Ativos: "#16a34a",
  Férias: "#2563eb",
  Afastados: "#f59e0b",
  Suspensos: "#ef4444",
  Inativos: "#94a3b8",
};

const tipoColors: Record<string, string> = {
  Advertência: "#ef6b4a",
  Suspensão: "#f0b63f",
  Férias: "#3b82f6",
  Afastamento: "#f59e0b",
  Demissão: "#9ca3af",
  Retorno: "#22c55e",
  Observação: "#64748b",
  "Acidente de Trabalho": "#e11d48",
};

const chartColors = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444", "#94a3b8"];

export default function DashboardPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    setLoading(true);

    try {
      const { data: funcionariosData, error: funcionariosError } =
        await supabase
          .from("funcionarios")
          .select("*")
          .order("nome", { ascending: true });

      if (funcionariosError) throw funcionariosError;

      const { data: movimentacoesData, error: movimentacoesError } =
        await supabase
          .from("movimentacoes")
          .select("*")
          .order("data", { ascending: false });

      if (movimentacoesError) throw movimentacoesError;

      setFuncionarios((funcionariosData as Funcionario[]) || []);
      setMovimentacoes((movimentacoesData as Movimentacao[]) || []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      alert("Erro ao carregar dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const ativos = funcionarios.filter((f) => f.situacao === "Ativo").length;
  const ferias = funcionarios.filter((f) => f.situacao === "Férias").length;
  const afastados = funcionarios.filter((f) => f.situacao === "Afastado").length;
  const suspensos = funcionarios.filter((f) => f.situacao === "Suspenso").length;
  const inativos = funcionarios.filter((f) => f.situacao === "Inativo").length;

  const admitidosRecentemente = useMemo(() => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() - 30);

    return funcionarios.filter((f) => {
      if (!f.admissao) return false;
      const dataAdmissao = new Date(f.admissao);
      return !isNaN(dataAdmissao.getTime()) && dataAdmissao >= limite;
    }).length;
  }, [funcionarios]);

  const movimentacoesRecentes = useMemo(() => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() - 7);

    return movimentacoes.filter((m) => {
      if (!m.data) return false;
      const dataMov = new Date(m.data);
      return !isNaN(dataMov.getTime()) && dataMov >= limite;
    }).length;
  }, [movimentacoes]);

  const percentualAtivos = useMemo(() => {
    if (!funcionarios.length) return 0;
    return Math.round((ativos / funcionarios.length) * 100);
  }, [ativos, funcionarios.length]);

  const dadosSituacao = useMemo(
    () =>
      [
        { name: "Ativos", value: ativos },
        { name: "Férias", value: ferias },
        { name: "Afastados", value: afastados },
        { name: "Suspensos", value: suspensos },
        { name: "Inativos", value: inativos },
      ].filter((item) => item.value > 0),
    [ativos, ferias, afastados, suspensos, inativos]
  );

  const dadosMovimentacao = useMemo(() => {
    const contagem: Record<string, number> = {};

    movimentacoes.forEach((mov) => {
      contagem[mov.tipo] = (contagem[mov.tipo] || 0) + 1;
    });

    return Object.entries(contagem).map(([tipo, total]) => ({
      tipo,
      total,
      fill: tipoColors[tipo] || "#64748b",
    }));
  }, [movimentacoes]);

  const alertasImportantes = useMemo(() => {
    const lista: { titulo: string; descricao: string; prioridade: number; tone: "amber" | "orange" | "red" | "blue" }[] = [];

    if (ferias > 0) {
      lista.push({
        titulo: "Funcionários em férias",
        descricao: `${ferias} funcionário(s) estão em gozo de férias atualmente.`,
        prioridade: 1,
        tone: "amber",
      });
    }

    if (afastados > 0) {
      lista.push({
        titulo: "Afastamentos em aberto",
        descricao: `${afastados} funcionário(s) estão afastados no momento.`,
        prioridade: 2,
        tone: "orange",
      });
    }

    if (suspensos > 0) {
      lista.push({
        titulo: "Suspensões ativas",
        descricao: `${suspensos} registro(s) com situação de suspensão ativa.`,
        prioridade: 3,
        tone: "red",
      });
    }

    if (admitidosRecentemente > 0) {
      lista.push({
        titulo: "Admissões recentes",
        descricao: `${admitidosRecentemente} admissão(ões) registradas nos últimos 30 dias.`,
        prioridade: 4,
        tone: "blue",
      });
    }

    return lista.sort((a, b) => a.prioridade - b.prioridade).slice(0, 4);
  }, [ferias, afastados, suspensos, admitidosRecentemente]);

  const ultimasMovimentacoes = useMemo(() => {
    return [...movimentacoes]
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 5);
  }, [movimentacoes]);

  const ultimosAdmitidos = useMemo(() => {
    return [...funcionarios]
      .filter((f) => !!f.admissao)
      .sort((a, b) => b.admissao.localeCompare(a.admissao))
      .slice(0, 4);
  }, [funcionarios]);

  function formatarData(data: string) {
    if (!data) return "-";
    if (!data.includes("-")) return data;
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function badgeToneMovimentacao(tipo: string) {
    if (tipo === "Férias") return "blue" as const;
    if (tipo === "Afastamento") return "amber" as const;
    if (tipo === "Advertência") return "orange" as const;
    if (tipo === "Suspensão") return "red" as const;
    if (tipo === "Demissão") return "gray" as const;
    if (tipo === "Retorno") return "green" as const;
    if (tipo === "Acidente de Trabalho") return "red" as const;
    return "gray" as const;
  }

  function descricaoResumida(texto?: string) {
    if (!texto) return "-";
    if (texto.length <= 70) return texto;
    return `${texto.slice(0, 70)}...`;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-6">
        <PageHeader
          title="Dashboard"
          description="Visão geral do controle interno de pessoal"
        />

        <Card className="p-8">
          <p className="text-sm text-slate-500">Carregando dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do controle interno de pessoal"
        actions={
          <Link
            href="/funcionarios/novo"
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg"
          >
            + Cadastrar Funcionário
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Funcionários"
          value={funcionarios.length}
          subtitle="Quadro geral"
          icon={<Users size={18} />}
          tone="default"
        />
        <StatCard
          title="Ativos"
          value={ativos}
          subtitle={`${percentualAtivos}% do quadro`}
          icon={<CheckCircle2 size={18} />}
          tone="green"
        />
        <StatCard
          title="Férias"
          value={ferias}
          subtitle="Em gozo no momento"
          icon={<Plane size={18} />}
          tone="blue"
        />
        <StatCard
          title="Afastados"
          value={afastados}
          subtitle="Exigem acompanhamento"
          icon={<ShieldAlert size={18} />}
          tone="amber"
        />
        <StatCard
          title="Suspensos"
          value={suspensos}
          subtitle="Situação disciplinar"
          icon={<PauseCircle size={18} />}
          tone="orange"
        />
        <StatCard
          title="Inativos"
          value={inativos}
          subtitle="Cadastros inativos"
          icon={<UserX size={18} />}
          tone="gray"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="border-slate-200 bg-slate-50/70 p-6">
          <div className="flex items-center gap-2 text-slate-900">
            <BellRing size={20} className="text-amber-500" />
            <h2 className="text-[2rem] font-semibold tracking-tight">Atenções</h2>
          </div>

          <div className="mt-5 space-y-4">
            {alertasImportantes.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">
                  Nenhum alerta importante no momento.
                </p>
              </div>
            ) : (
              alertasImportantes.map((item, index) => (
                <AlertaCard
                  key={index}
                  titulo={item.titulo}
                  descricao={item.descricao}
                  tone={item.tone}
                />
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <MiniInfoCard
            title="Admissões recentes"
            value={admitidosRecentemente}
            subtitle="Últimos 30 dias"
            icon={<UserPlus size={18} />}
          />
          <MiniInfoCard
            title="Movimentações recentes"
            value={movimentacoesRecentes}
            subtitle="Últimos 7 dias"
            icon={<ArrowRightLeft size={18} />}
          />
          <MiniInfoCard
            title="Quadro ativo"
            value={ativos}
            subtitle="Funcionários em atividade"
            icon={<Briefcase size={18} />}
            iconTone="green"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard
          title="Distribuição por situação"
          description="Visão consolidada do quadro atual"
          action={
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
              {funcionarios.length} total
            </span>
          }
        >
          {dadosSituacao.length === 0 ? (
            <EmptyState
              title="Sem dados para exibir"
              description="Ainda não há dados suficientes para montar a distribuição por situação."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosSituacao}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={88}
                      stroke="white"
                      strokeWidth={2}
                    >
                      {dadosSituacao.map((item, index) => (
                        <Cell
                          key={index}
                          fill={situacaoColors[item.name] || chartColors[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {dadosSituacao.map((item, index) => {
                  const percentual = funcionarios.length
                    ? ((item.value / funcionarios.length) * 100).toFixed(1)
                    : "0";

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{
                            backgroundColor:
                              situacaoColors[item.name] || chartColors[index],
                          }}
                        />
                        <span className="font-medium text-slate-700">
                          {item.name}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {item.value}
                        </p>
                        <p className="text-xs text-slate-500">{percentual}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Movimentações por tipo"
          description="Histórico consolidado dos eventos lançados"
          action={<FileBarChart2 size={18} className="text-slate-400" />}
        >
          {dadosMovimentacao.length === 0 ? (
            <EmptyState
              title="Nenhuma movimentação registrada"
              description="Cadastre movimentações para visualizar este gráfico."
            />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMovimentacao} barCategoryGap={24}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[10, 10, 0, 0]} barSize={34}>
                    {dadosMovimentacao.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard
          title="Últimas movimentações"
          description="Eventos mais recentes registrados no sistema"
        >
          <div className="space-y-4">
            {ultimasMovimentacoes.length === 0 ? (
              <EmptyState
                title="Nenhuma movimentação registrada"
                description="Os eventos lançados aparecerão aqui."
              />
            ) : (
              ultimasMovimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <UserCircle2 size={18} className="text-slate-400" />
                      <p className="truncate text-lg font-semibold text-slate-900">
                        {mov.funcionario_nome || "-"}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge tone={badgeToneMovimentacao(mov.tipo)}>
                        {mov.tipo}
                      </StatusBadge>
                      <span className="text-sm text-slate-600">
                        {descricaoResumida(mov.descricao)}
                      </span>
                    </div>
                  </div>

                  <span className="whitespace-nowrap text-sm text-slate-500">
                    {formatarData(mov.data)}
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Últimos admitidos"
            description="Funcionários mais recentes cadastrados"
          >
            {ultimosAdmitidos.length === 0 ? (
              <EmptyState
                title="Nenhum funcionário cadastrado"
                description="Os cadastros mais recentes aparecerão aqui."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {ultimosAdmitidos.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 size={26} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {funcionario.nome}
                      </p>
                      <p className="truncate text-sm text-slate-600">
                        {funcionario.cargo}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatarData(funcionario.admissao)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Ações rápidas">
            <div className="grid gap-3">
              <QuickAction
                href="/funcionarios/novo"
                icon={<UserPlus size={18} />}
                label="Cadastrar Funcionário"
                tone="blue"
              />
              <QuickAction
                href="/movimentacoes"
                icon={<ClipboardPlus size={18} />}
                label="Registrar Movimentação"
                tone="amber"
              />
              <QuickAction
                href="/movimentacoes"
                icon={<FileBarChart2 size={18} />}
                label="Ver histórico"
                tone="green"
              />
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
        <div className="flex items-center gap-3 text-sm text-blue-700">
          <Info size={16} />
          <span>
            Mantenha os cadastros e registros sempre atualizados para um melhor controle da gestão de pessoas.
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "amber" | "green";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    green: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-medium transition ${toneClasses[tone]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function MiniInfoCard({
  title,
  value,
  subtitle,
  icon,
  iconTone = "default",
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconTone?: "default" | "blue" | "green";
}) {
  const iconTones = {
    default: "bg-slate-100 text-slate-500",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base text-slate-500">{title}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconTones[iconTone]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function AlertaCard({
  titulo,
  descricao,
  tone,
}: {
  titulo: string;
  descricao: string;
  tone: "amber" | "orange" | "red" | "blue";
}) {
  const toneClasses = {
    amber: "border-l-2 border-l-amber-400",
    orange: "border-l-2 border-l-orange-400",
    red: "border-l-2 border-l-red-400",
    blue: "border-l-2 border-l-blue-400",
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${toneClasses[tone]}`}
    >
      <p className="text-base font-semibold text-slate-900">{titulo}</p>
      <p className="mt-1 text-sm text-slate-600">{descricao}</p>
    </div>
  );
}