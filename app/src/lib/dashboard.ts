import { MOTIVO_LABEL, type AuditoriaCompleta, type Motivo } from "./types";
import { dataParaMes, somarMeses } from "./format";

export interface MesAgg {
  mes: string; // AAAA-MM
  agua: number;
  energia: number;
  produtos: number;
  total: number;
  desperdicio: number;
  /** RN05: desperdício ÷ gasto com produtos × 100; null quando produtos = 0 */
  pctProdutos: number | null;
}

export function agregar(
  auditorias: AuditoriaCompleta[],
  { incluirInativas = false }: { incluirInativas?: boolean } = {},
) {
  const ativas = incluirInativas ? auditorias : auditorias.filter((a) => a.ativo);
  const porMes = new Map<string, MesAgg>();
  const porMotivo: Record<Motivo, number> = { sobra: 0, validade: 0, erro_mistura: 0, outro: 0 };
  const porProduto = new Map<string, number>();
  const nomes = new Map<string, string>();

  for (const a of ativas) {
    const mes = dataParaMes(a.mes_referencia);
    const m =
      porMes.get(mes) ?? { mes, agua: 0, energia: 0, produtos: 0, total: 0, desperdicio: 0, pctProdutos: null };
    for (const c of a.consumos) {
      const v = Number(c.valor_reais) || 0;
      m[c.tipo] += v;
      m.total += v;
    }
    for (const d of a.desperdicios) {
      const v = Number(d.valor_estimado) || 0;
      m.desperdicio += v;
      porMotivo[d.motivo] = (porMotivo[d.motivo] ?? 0) + v;
      const nome = d.produto.trim();
      const chave = nome.toLowerCase();
      porProduto.set(chave, (porProduto.get(chave) ?? 0) + v);
      if (!nomes.has(chave)) nomes.set(chave, nome);
    }
    porMes.set(mes, m);
  }

  const meses = [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes));
  for (const m of meses) m.pctProdutos = m.produtos > 0 ? (m.desperdicio / m.produtos) * 100 : null;
  const gastoTotal = meses.reduce((s, m) => s + m.total, 0);
  const desperdicioTotal = meses.reduce((s, m) => s + m.desperdicio, 0);
  const produtosTotal = meses.reduce((s, m) => s + m.produtos, 0);
  // RN05: desperdício do período ÷ gasto com produtos do período × 100
  const pctDesperdicioProdutos = produtosTotal > 0 ? (desperdicioTotal / produtosTotal) * 100 : null;

  const recente = meses.at(-1) ?? null;
  const anterior = recente ? (porMes.get(somarMeses(recente.mes, -1)) ?? null) : null;
  const variacao =
    recente && anterior && anterior.total > 0 ? ((recente.total - anterior.total) / anterior.total) * 100 : null;

  const motivos = (Object.keys(porMotivo) as Motivo[]).map((k) => ({
    motivo: MOTIVO_LABEL[k],
    valor: porMotivo[k],
  }));
  const topProdutos = [...porProduto.entries()]
    .map(([k, v]) => ({ produto: nomes.get(k) ?? k, valor: v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return { meses, gastoTotal, desperdicioTotal, produtosTotal, pctDesperdicioProdutos, recente, anterior, variacao, motivos, topProdutos };
}
