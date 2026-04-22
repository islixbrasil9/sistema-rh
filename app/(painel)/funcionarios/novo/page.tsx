"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { SituacaoFuncionario } from "@/types/funcionarios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCPF(valor: string) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  }
  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9, 11)}`;
}

function formatarPIS(valor: string) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 8) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  }
  if (numeros.length <= 10) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 8)}.${numeros.slice(8)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 8)}.${numeros.slice(
    8,
    10
  )}-${numeros.slice(10, 11)}`;
}

function formatarTelefone(valor: string) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }
  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(
      6
    )}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

export default function NovoFuncionarioPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [pis, setPis] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [salario, setSalario] = useState("");
  const [situacao, setSituacao] = useState<SituacaoFuncionario>("Ativo");
  const [admissao, setAdmissao] = useState("");
  const [saving, setSaving] = useState(false);

  async function cadastrarFuncionario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nome.trim()) {
      alert("Informe o nome do funcionário.");
      return;
    }

    if (!cargo.trim()) {
      alert("Informe o cargo do funcionário.");
      return;
    }

    if (!admissao) {
      alert("Informe a data de admissão.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nome: nome.trim(),
        cpf: cpf ? somenteNumeros(cpf) : null,
        pis: pis ? somenteNumeros(pis) : null,
        data_nascimento: dataNascimento || null,
        telefone: telefone ? somenteNumeros(telefone) : null,
        cargo: cargo.trim(),
        setor: setor.trim() || null,
        salario: salario ? Number(salario) : null,
        situacao,
        admissao,
      };

      const { error } = await supabase.from("funcionarios").insert([payload]);

      if (error) throw error;

      alert("Funcionário cadastrado com sucesso.");
      router.push("/funcionarios");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao cadastrar funcionário:", error);

      if (error?.message?.includes("funcionarios_cpf_key")) {
        alert("Já existe um funcionário cadastrado com este CPF.");
      } else {
        alert("Erro ao cadastrar funcionário.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Novo Funcionário"
        description="Cadastre um novo funcionário no sistema"
        actions={
          <Button href="/funcionarios" variant="outline">
            Voltar
          </Button>
        }
      />

      <SectionCard title="Dados do funcionário">
        <form onSubmit={cadastrarFuncionario} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <Input
              label="CPF"
              type="text"
              value={formatarCPF(cpf)}
              onChange={(e) => setCpf(somenteNumeros(e.target.value).slice(0, 11))}
              placeholder="000.000.000-00"
            />

            <Input
              label="PIS"
              type="text"
              value={formatarPIS(pis)}
              onChange={(e) => setPis(somenteNumeros(e.target.value).slice(0, 11))}
              placeholder="000.00000.00-0"
            />

            <Input
              label="Data de nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />

            <Input
              label="Telefone"
              type="text"
              value={formatarTelefone(telefone)}
              onChange={(e) =>
                setTelefone(somenteNumeros(e.target.value).slice(0, 11))
              }
              placeholder="(00) 00000-0000"
            />

            <Input
              label="Cargo"
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              required
            />

            <Input
              label="Setor"
              type="text"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
            />

            <Input
              label="Salário"
              type="number"
              min="0"
              step="0.01"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
            />

            <Select
              label="Situação"
              value={situacao}
              onChange={(e) =>
                setSituacao(e.target.value as SituacaoFuncionario)
              }
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
              value={admissao}
              onChange={(e) => setAdmissao(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving} variant="primary">
              {saving ? "Cadastrando..." : "Cadastrar funcionário"}
            </Button>

            <Button href="/funcionarios" variant="outline">
              Cancelar
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}