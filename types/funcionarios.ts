export type SituacaoFuncionario =
  | "Ativo"
  | "Férias"
  | "Afastado"
  | "Suspenso"
  | "Inativo";

export type Funcionario = {
  id: string;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
  cargo: string;
  setor?: string | null;
  salario?: number | null;
  situacao: SituacaoFuncionario;
  admissao: string;
  pis?: string | null;
  data_nascimento?: string | null;
};