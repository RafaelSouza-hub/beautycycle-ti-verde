import type { CSSProperties, RefObject } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MesAgg } from "@/lib/dashboard";
import { formatBRL, formatMesCurto } from "@/lib/format";

export interface GraficosHandle {
  gastoMes: HTMLDivElement | null;
  desperdicioMes: HTMLDivElement | null;
  desperdicioMotivo: HTMLDivElement | null;
  topProdutos: HTMLDivElement | null;
}

const CORES = {
  agua: "#3D82C9",
  energia: "#E3B54A",
  produtos: "#2E9D6B",
  desperdicio: "#DB7A45",
};

const CARTAO: CSSProperties = {
  width: 760,
  height: 380,
  background: "#ffffff",
  border: "1px solid #e3e8e5",
  borderRadius: 14,
  padding: "16px 18px",
  boxSizing: "border-box",
  color: "#1f2937",
  fontFamily: "Helvetica, Arial, sans-serif",
};
const TITULO: CSSProperties = { margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: "#1f2937" };
const SEM_DADOS: CSSProperties = {
  display: "grid",
  placeItems: "center",
  height: 300,
  margin: 0,
  fontSize: 15,
  color: "#6b7280",
};
const EIXO = { fontSize: 12, stroke: "#6b7280" };
const eixoReais = (v: number) => `R$ ${Math.round(Number(v))}`;
const tooltipReais = (v: number) => formatBRL(Number(v));

/**
 * Renderiza os quatro gráficos do relatório fora da tela, com tamanho fixo e
 * sem animação, para que possam ser fotografados e colados no PDF.
 */
export function RelatorioGraficos({
  meses,
  motivos,
  topProdutos,
  handle,
}: {
  meses: MesAgg[];
  motivos: { motivo: string; valor: number }[];
  topProdutos: { produto: string; valor: number }[];
  handle: RefObject<GraficosHandle>;
}) {
  const dados = meses.map((m) => ({ ...m, rotulo: formatMesCurto(m.mes) }));
  const comMotivo = motivos.filter((m) => m.valor > 0);

  return (
    <div
      aria-hidden
      style={{ position: "fixed", left: -10000, top: 0, zIndex: -1, pointerEvents: "none" }}
    >
      <div style={CARTAO} ref={(el) => { handle.current.gastoMes = el; }}>
        <h3 style={TITULO}>Gasto por mês — Água, Energia e Produtos</h3>
        {dados.length === 0 ? (
          <p style={SEM_DADOS}>Sem dados no período</p>
        ) : (
          <BarChart width={720} height={300} data={dados}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="rotulo" {...EIXO} />
            <YAxis {...EIXO} width={60} tickFormatter={eixoReais} />
            <Tooltip formatter={tooltipReais} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="agua" name="Água" stackId="g" fill={CORES.agua} isAnimationActive={false} />
            <Bar dataKey="energia" name="Energia" stackId="g" fill={CORES.energia} isAnimationActive={false} />
            <Bar
              dataKey="produtos"
              name="Produtos"
              stackId="g"
              fill={CORES.produtos}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </div>

      <div style={CARTAO} ref={(el) => { handle.current.desperdicioMes = el; }}>
        <h3 style={TITULO}>Desperdício em R$ por mês</h3>
        {dados.length === 0 ? (
          <p style={SEM_DADOS}>Sem dados no período</p>
        ) : (
          <LineChart width={720} height={300} data={dados}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="rotulo" {...EIXO} />
            <YAxis {...EIXO} width={60} tickFormatter={eixoReais} />
            <Tooltip formatter={tooltipReais} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line
              dataKey="desperdicio"
              name="Desperdício"
              stroke={CORES.desperdicio}
              strokeWidth={3}
              dot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </div>

      <div style={CARTAO} ref={(el) => { handle.current.desperdicioMotivo = el; }}>
        <h3 style={TITULO}>Desperdício em R$ por motivo</h3>
        {comMotivo.length === 0 ? (
          <p style={SEM_DADOS}>Sem dados no período</p>
        ) : (
          <BarChart width={720} height={300} data={comMotivo}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="motivo" fontSize={11} interval={0} stroke="#6b7280" />
            <YAxis {...EIXO} width={60} tickFormatter={eixoReais} />
            <Tooltip formatter={tooltipReais} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar
              dataKey="valor"
              name="Valor desperdiçado"
              fill={CORES.desperdicio}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </div>

      <div style={CARTAO} ref={(el) => { handle.current.topProdutos = el; }}>
        <h3 style={TITULO}>Ranking — 5 produtos que mais geraram desperdício</h3>
        {topProdutos.length === 0 ? (
          <p style={SEM_DADOS}>Sem dados no período</p>
        ) : (
          <BarChart layout="vertical" width={720} height={300} data={topProdutos}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" {...EIXO} tickFormatter={eixoReais} />
            <YAxis type="category" dataKey="produto" width={170} fontSize={11} stroke="#6b7280" />
            <Tooltip formatter={tooltipReais} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar
              dataKey="valor"
              name="Valor desperdiçado"
              fill={CORES.desperdicio}
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </div>
    </div>
  );
}
