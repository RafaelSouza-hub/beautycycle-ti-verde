export type TipoConsumo = "agua" | "energia" | "produtos";
export type UnidadeConsumo = "m3" | "kWh" | "unidades";
export type UnidadeDesperdicio = "g" | "ml" | "unidades";
export type Motivo = "sobra" | "validade" | "erro_mistura" | "outro";

export interface Salao {
  id: string;
  user_id: string;
  nome: string | null;
  responsavel: string | null;
  bairro: string | null;
  cidade: string | null;
  telefone: string | null;
  criado_em: string;
}

export interface Auditoria {
  id: string;
  salao_id: string;
  mes_referencia: string;
  observacoes: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface Consumo {
  id: string;
  auditoria_id: string;
  tipo: TipoConsumo;
  valor_reais: number;
  quantidade: number;
  unidade: UnidadeConsumo;
  produto: string | null;
}

export interface Desperdicio {
  id: string;
  auditoria_id: string;
  produto: string;
  quantidade: number;
  unidade: UnidadeDesperdicio;
  valor_estimado: number;
  motivo: Motivo;
}

export interface AuditoriaCompleta extends Auditoria {
  consumos: Consumo[];
  desperdicios: Desperdicio[];
}

export const MOTIVO_LABEL: Record<Motivo, string> = {
  sobra: "Sobra",
  validade: "Validade vencida",
  erro_mistura: "Erro de mistura",
  outro: "Outro",
};

export const CONSUMO_INFO: Record<
  TipoConsumo,
  { label: string; unidade: UnidadeConsumo; unidadeLabel: string }
> = {
  agua: { label: "Água", unidade: "m3", unidadeLabel: "m³" },
  energia: { label: "Energia", unidade: "kWh", unidadeLabel: "kWh" },
  produtos: { label: "Produtos", unidade: "unidades", unidadeLabel: "unidades" },
};
