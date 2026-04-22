"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type FuncionarioForm = {
  nome: string;
  cpf: string;
  pis: string;
  data_nascimento: string;
  telefone: string;
  cargo: string;
  setor: string;
  salario: string;
  situacao: string;
  admissao: string;
};

const estadoInicial: FuncionarioForm = {
  nome: "",
  cpf: "",
  pis: "",
  data_nascimento: "",
  telefone: "",
  cargo: "",
  setor: "",
  salario: "",
  situacao: "Ativo",
  admissao: "",
};

export default function EditarFuncionarioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<FuncionarioForm>(estadoInicial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      carregarFuncionario();
    }
  }, [id]);

  async function carregarFuncionario() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setForm({
        nome: data.nome || "",
        cpf: data.cpf || "",
        pis: data.pis || "",
        data_nascimento: normalizarDataParaInput(data.data_nascimento || ""),
        telefone: data.telefone || "",
        cargo: data.cargo || "",
        setor: data.setor || "",
        salario: data.salario ? String(data.salario) : "",
        situacao: data.situacao || "Ativo",
        admissao: normalizarDataParaInput(data.admissao || ""),
      });
    } catch (error) {
      console.error("Erro ao carregar funcionário:", error);
      alert("Erro ao carregar dados do funcionário.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome.");
      return;
    }

    if (!form.cargo.trim()) {
      alert("Informe o cargo.");
      return;
    }

    if (!form.admissao) {
      alert("Informe a data de admissão.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("funcionarios")
        .update({
          nome: form.nome.trim(),
          cpf: form.cpf.trim() || null,
          pis: form.pis.trim() || null,
          data_nascimento: form.data_nascimento || null,
          telefone: form.telefone.trim() || null,
          cargo: form.cargo.trim(),
          setor: form.setor.trim() || null,
          salario: form.salario ? Number(form.salario) : 0,
          situacao: form.situacao,
          admissao: form.admissao,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Funcionário atualizado com sucesso!");
      router.push(`/funcionarios/${id}`);
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Editar Funcionário"
          description="Atualize os dados cadastrais do colaborador"
        />

        <Card className="p-8">
          <p className="text-sm text-slate-500">Carregando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Editar Funcionário"
        description="Atualize os dados cadastrais do colaborador"
        actions={
          <Button href={`/funcionarios/${id}`} variant="outline">
            Voltar
          </Button>
        }
      />

      <SectionCard title="Dados do funcionário">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Nome"
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="CPF"
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
            />

            <Input
              label="PIS"
              type="text"
              name="pis"
              value={form.pis}
              onChange={handleChange}
              placeholder="000.00000.00-0"
            />

            <Input
              label="Data de nascimento"
              type="date"
              name="data_nascimento"
              value={form.data_nascimento}
              onChange={handleChange}
            />

            <Input
              label="Telefone"
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(82) 99999-9999"
            />

            <Input
              label="Cargo"
              type="text"
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              required
            />

            <Input
              label="Setor"
              type="text"
              name="setor"
              value={form.setor}
              onChange={handleChange}
            />

            <Input
              label="Salário"
              type="number"
              step="0.01"
              name="salario"
              value={form.salario}
              onChange={handleChange}
            />

            <Select
              label="Situação"
              name="situacao"
              value={form.situacao}
              onChange={handleChange}
              options={[
                { label: "Ativo", value: "Ativo" },
                { label: "Férias", value: "Férias" },
                { label: "Afastado", value: "Afastado" },
                { label: "Suspenso", value: "Suspenso" },
                { label: "Inativo", value: "Inativo" },
              ]}
            />

            <Input
              label="Admissão"
              type="date"
              name="admissao"
              value={form.admissao}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving} variant="primary">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>

            <Button href={`/funcionarios/${id}`} variant="outline">
              Cancelar
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

function normalizarDataParaInput(data: string) {
  if (!data) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";

  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}