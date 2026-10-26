import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { agregar } from "./dashboard";
import { formatBRL, formatMes, formatNum, formatPct } from "./format";
import { CONSUMO_INFO, MOTIVO_LABEL, type AuditoriaCompleta } from "./types";

type Opcoes = Parameters<typeof autoTable>[1];

const VERDE: [number, number, number] = [46, 125, 91];
const BRANCO: [number, number, number] = [255, 255, 255];
const CINZA: [number, number, number] = [107, 114, 128];
const ESCURO: [number, number, number] = [31, 41, 47];
const ZEBRA: [number, number, number] = [244, 247, 245];
const LINHA: [number, number, number] = [222, 230, 226];

const MARGEM = 15;
const LARGURA = 210 - MARGEM * 2;
const TOPO = 36;
const RODAPE = 276;

const soReais = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);

export interface ImagemGrafico {
  dataUrl: string;
  width: number;
  height: number;
}

export interface DadosRelatorio {
  salaoNome: string;
  auditorias: AuditoriaCompleta[];
  inicio: string; // AAAA-MM
  fim: string; // AAAA-MM
  incluirInativas: boolean;
  imagens: ImagemGrafico[];
}

/** Nome do arquivo do relatório, conforme o modo escolhido. */
export function nomeDoArquivo({
  mes,
  inicio,
  fim,
}: {
  mes?: string | undefined;
  inicio: string;
  fim: string;
}) {
  return mes ? `BeautyCycle_Auditoria_${mes}.pdf` : `BeautyCycle_Relatorio_${inicio}_a_${fim}.pdf`;
}

export const CHAVES_GRAFICOS = ["gastoMes", "desperdicioMes", "desperdicioMotivo", "topProdutos"] as const;
export type ChaveGrafico = (typeof CHAVES_GRAFICOS)[number];

/** Captura os gráficos escondidos do relatório como imagens nítidas. */
export async function capturarGraficos(
  alvos: Partial<Record<ChaveGrafico, HTMLElement | null>>,
): Promise<ImagemGrafico[]> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const imagens: ImagemGrafico[] = [];
  for (const nome of CHAVES_GRAFICOS) {
    const alvo = alvos[nome];
    if (!alvo) continue;
    const canvas = await html2canvas(alvo, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    imagens.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height });
  }
  return imagens;
}

const estiloBase: Opcoes = {
  theme: "striped",
  styles: { font: "helvetica", fontSize: 9, cellPadding: 2, textColor: ESCURO, lineColor: LINHA, lineWidth: 0.1 },
  headStyles: { fillColor: VERDE, textColor: BRANCO, fontStyle: "bold" },
  bodyStyles: { minCellHeight: 6 },
  alternateRowStyles: { fillColor: ZEBRA },
  footStyles: { fillColor: [232, 240, 236], textColor: VERDE, fontStyle: "bold" },
  margin: { left: MARGEM, right: MARGEM, top: TOPO, bottom: 24 },
};

export function gerarRelatorioPdf(d: DadosRelatorio): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const agg = agregar(d.auditorias, { incluirInativas: d.incluirInativas });
  // RN05 vale só para auditorias ativas, mesmo quando o relatório inclui inativas
  const aggAtivas = d.incluirInativas ? agregar(d.auditorias) : agg;
  const usadas = d.auditorias.filter((a) => d.incluirInativas || a.ativo);
  const periodo = `${formatMes(d.inicio)} a ${formatMes(d.fim)}`;

  let y = TOPO;
  const quebra = (h: number) => {
    if (y + h > RODAPE) {
      doc.addPage();
      y = TOPO;
    }
  };
  const secao = (titulo: string) => {
    quebra(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...VERDE);
    doc.text(titulo, MARGEM, y);
    doc.setDrawColor(...VERDE);
    doc.setLineWidth(0.4);
    doc.line(MARGEM, y + 1.6, MARGEM + LARGURA, y + 1.6);
    y += 8;
  };
  const rotulo = (texto: string) => {
    quebra(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...ESCURO);
    doc.text(texto, MARGEM, y);
    y += 4;
  };
  const nota = (texto: string) => {
    quebra(8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...CINZA);
    doc.text(texto, MARGEM, y);
    y += 6;
  };
  const tabela = (opts: Opcoes) => {
    autoTable(doc, { ...estiloBase, ...opts });
    const final = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    y = (final?.finalY ?? y) + 6;
  };

  // ---------- Seção 1: resumo do período ----------
  secao("1. Resumo do período");
  const variacao =
    agg.variacao === null
      ? "Sem dados do mês anterior para comparar"
      : `${agg.variacao <= 0 ? "Redução" : "Aumento"} de ${Math.abs(agg.variacao).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })}% em relação a ${agg.anterior ? formatMes(agg.anterior.mes) : "mês anterior"}`;

  tabela({
    startY: y,
    head: [["Indicador", "Valor"]],
    body: [
      ["Gasto total no período (água, energia e produtos)", formatBRL(agg.gastoTotal)],
      [
        agg.recente ? `Gasto de ${formatMes(agg.recente.mes)} (mês mais recente)` : "Mês mais recente",
        agg.recente ? formatBRL(agg.recente.total) : "—",
      ],
      ["Variação em relação ao mês anterior", variacao],
      ["Desperdício total no período", formatBRL(agg.desperdicioTotal)],
      ["Desperdício sobre gasto com produtos", formatPct(aggAtivas.pctDesperdicioProdutos)],
      ["Auditorias consideradas", String(usadas.length)],
    ],
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  rotulo("Gráficos do período");
  if (d.imagens.length === 0) {
    nota("Sem dados no período");
  } else {
    for (const img of d.imagens) {
      const altura = (img.height / img.width) * LARGURA;
      quebra(altura + 6);
      doc.addImage(img.dataUrl, "JPEG", MARGEM, y, LARGURA, altura);
      y += altura + 6;
    }
  }

  // ---------- Seção 2: detalhamento por auditoria ----------
  secao("2. Detalhamento por auditoria");
  if (usadas.length === 0) {
    nota("Nenhuma auditoria no período");
  }
  const lista = [...usadas].sort((a, b) => a.mes_referencia.localeCompare(b.mes_referencia));
  for (const a of lista) {
    quebra(50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...VERDE);
    doc.text(formatMes(a.mes_referencia), MARGEM, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(a.ativo ? 46 : 180, a.ativo ? 125 : 70, a.ativo ? 91 : 60);
    doc.text(a.ativo ? "Ativa" : "Inativa", MARGEM + LARGURA, y, { align: "right" });
    y += 5;

    if (a.observacoes) {
      const linhas = doc.splitTextToSize(a.observacoes, LARGURA);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...CINZA);
      doc.text(linhas, MARGEM, y);
      y += linhas.length * 4 + 2;
    }

    const gasto = a.consumos.reduce((s, c) => s + Number(c.valor_reais), 0);
    const desperdicio = a.desperdicios.reduce((s, x) => s + Number(x.valor_estimado), 0);

    rotulo("Consumos");
    tabela({
      startY: y,
      head: [["Tipo", "Produto", "Valor (R$)", "Quantidade", "Unidade"]],
      body: a.consumos.map((c) => [
        CONSUMO_INFO[c.tipo].label,
        c.tipo === "produtos" ? c.produto?.trim() || "Produto sem nome" : "—",
        soReais(c.valor_reais),
        formatNum(Number(c.quantidade)),
        CONSUMO_INFO[c.tipo].unidadeLabel,
      ]),
      foot: [["Total", "", soReais(gasto), "", ""]],
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    });

    rotulo("Desperdícios");
    if (a.desperdicios.length === 0) {
      nota("Nenhum registro");
    } else {
      tabela({
        startY: y,
        head: [["Produto", "Quantidade", "Unidade", "Valor estimado (R$)", "Motivo"]],
        body: a.desperdicios.map((x) => [
          x.produto,
          formatNum(Number(x.quantidade)),
          x.unidade,
          soReais(x.valor_estimado),
          MOTIVO_LABEL[x.motivo],
        ]),
        foot: [["Total", "", "", soReais(desperdicio), ""]],
        columnStyles: { 1: { halign: "right" }, 3: { halign: "right" } },
      });
    }

    quebra(12);
    doc.setFillColor(...ZEBRA);
    doc.rect(MARGEM, y, LARGURA, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...VERDE);
    doc.text(`Gasto total: ${formatBRL(gasto)}    Desperdício: ${formatBRL(desperdicio)}`, MARGEM + 3, y + 6);
    y += 15;
  }

  // ---------- Seção 3: fechamento ----------
  secao("3. Fechamento do período");
  const totais = agg.meses.reduce(
    (s, m) => ({
      agua: s.agua + m.agua,
      energia: s.energia + m.energia,
      produtos: s.produtos + m.produtos,
      total: s.total + m.total,
      desperdicio: s.desperdicio + m.desperdicio,
    }),
    { agua: 0, energia: 0, produtos: 0, total: 0, desperdicio: 0 },
  );
  tabela({
    startY: y,
    head: [["Mês", "Água", "Energia", "Produtos", "Gasto total", "Desperdício"]],
    body: agg.meses.map((m) => [
      formatMes(m.mes),
      soReais(m.agua),
      soReais(m.energia),
      soReais(m.produtos),
      soReais(m.total),
      soReais(m.desperdicio),
    ]),
    foot: [
      [
        "Total geral",
        soReais(totais.agua),
        soReais(totais.energia),
        soReais(totais.produtos),
        soReais(totais.total),
        soReais(totais.desperdicio),
      ],
    ],
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  // ---------- Cabeçalho e rodapé em todas as páginas ----------
  const totalPaginas = doc.getNumberOfPages();
  const geradoEm = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  const cabecalho = d.salaoNome.trim() ? `BeautyCycle – ${d.salaoNome.trim()}` : "BeautyCycle";
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFillColor(...VERDE);
    doc.rect(0, 0, 210, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRANCO);
    doc.text(cabecalho, MARGEM, 11.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...VERDE);
    doc.text("Relatório de Auditorias", MARGEM, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...CINZA);
    doc.text(`Período: ${periodo}`, MARGEM, 30);

    doc.setDrawColor(...VERDE);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, 282, 210 - MARGEM, 282);
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text(`Gerado em ${geradoEm}`, MARGEM, 287);
    doc.text(`Página ${i} de ${totalPaginas}`, 210 - MARGEM, 287, { align: "right" });
  }

  return doc.output("blob");
}
