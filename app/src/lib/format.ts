import { z } from "zod";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export const formatBRL = (v: number) => brl.format(Number(v) || 0);
export const formatNum = (v: number) => num.format(Number(v) || 0);

const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** Percentual em pt-BR; null vira "—" (divisão por zero) */
export const formatPct = (v: number | null) => (v === null ? "—" : `${pct.format(v)}%`);

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "2026-10-01" ou "2026-10" -> "Outubro/2026" (sem Date, sem fuso) */
export function formatMes(iso: string) {
  const [y = "", m = "1"] = iso.split("-");
  return `${MESES[Number(m) - 1]}/${y}`;
}
export function formatMesCurto(iso: string) {
  const [y = "", m = "1"] = iso.split("-");
  return `${MESES_CURTOS[Number(m) - 1]}/${y.slice(2)}`;
}

/** "AAAA-MM" -> "AAAA-MM-01" montado como texto */
export const mesParaData = (ym: string) => `${ym.slice(0, 7)}-01`;
export const dataParaMes = (iso: string) => iso.slice(0, 7);

/** Soma meses a um "AAAA-MM" sem usar Date */
export function somarMeses(ym: string, delta: number) {
  const [y = 0, m = 1] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Atalho de N meses terminando em `atual` (AAAA-MM) */
export const periodoAtalho = (atual: string, n: number) => ({ inicio: somarMeses(atual, -(n - 1)), fim: atual });

export function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Aceita vírgula ou ponto como separador decimal */
export function parseDecimal(v: string | number): number {
  if (typeof v === "number") return v;
  const s = v.trim().replace(/\s/g, "");
  if (!s) return NaN;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return /^-?\d*\.?\d+$/.test(normalized) ? Number(normalized) : NaN;
}

export const decimalField = z
  .string()
  .min(1, "Campo obrigatório")
  .refine((v) => !Number.isNaN(parseDecimal(v)), "Informe um número válido")
  .refine((v) => parseDecimal(v) >= 0, "O valor deve ser maior ou igual a zero");

export const numToInput = (v: number) => String(v).replace(".", ",");
