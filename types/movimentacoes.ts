export type TipoMovimentacao =
  | "Advertência"
  | "Suspensão"
  | "Férias"
  | "Afastamento"
  | "Retorno"
  | "Demissão"
  | "Acidente de Trabalho";

export type Movimentacao = {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  tipo: TipoMovimentacao;
  descricao: string;
  data: string;
};