import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ClipboardPlus, Droplets, FileDown, Percent, Trash2, Wallet } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio, ErroCarregar, PeriodoFiltro } from "@/components/common";
import { AuditoriaForm } from "@/components/AuditoriaForm";
import { ExportarPdfDialog } from "@/components/ExportarPdfDialog";
import { useAuditorias } from "@/hooks/useAuditorias";
import { agregar } from "@/lib/dashboard";
import { formatBRL, formatMes, formatMesCurto, formatPct, mesAtual, periodoAtalho, somarMeses } from "@/lib/format";

const ATALHOS = [3, 6, 12] as const;
import { traduzirErro } from "@/lib/errors";

export const Route = createFileRoute("/_protegido/inicio")({
  head: () => ({
    meta: [
      { title: "Início — BeautyCycle" },
      { name: "description", content: "Resumo de gastos e desperdício do salão." },
      { property: "og:title", content: "Início — BeautyCycle" },
      { property: "og:description", content: "Resumo de gastos e desperdício do salão." },
    ],
  }),
  component: Inicio,
});

const tooltipBRL = (v: number) => formatBRL(v);
const eixoBRL = (v: number) => `R$ ${Math.round(v)}`;

/** Tooltip do gráfico "Desperdício por mês": valor em R$ + percentual sobre o gasto com produtos (RN05) */
function TooltipDesperdicio({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload?: { desperdicio?: number; pctProdutos?: number | null } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const m = payload[0]?.payload;
  if (!m) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p>Desperdício: {formatBRL(Number(m.desperdicio ?? 0))}</p>
      <p className="text-muted-foreground">Sobre gasto com produtos: {formatPct(m.pctProdutos ?? null)}</p>
    </div>
  );
}

function Inicio() {
  const [fim, setFim] = useState(mesAtual());
  const [inicio, setInicio] = useState(somarMeses(mesAtual(), -5));
  const [novo, setNovo] = useState(false);
  const [exportar, setExportar] = useState(false);
  const q = useAuditorias({ inicio, fim });
  const agg = useMemo(() => agregar(q.data ?? []), [q.data]);
  const meses = agg.meses.map((m) => ({ ...m, rotulo: formatMesCurto(m.mes) }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Início</h1>
      <div className="card-soft space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2 md:w-96">
          {ATALHOS.map((n) => {
            const p = periodoAtalho(mesAtual(), n);
            const ativo = p.inicio === inicio && p.fim === fim;
            return (
              <Button
                key={n}
                type="button"
                variant={ativo ? "default" : "outline"}
                aria-pressed={ativo}
                className={`h-11 ${ativo ? "" : "border-primary text-primary"}`}
                onClick={() => { setInicio(p.inicio); setFim(p.fim); }}
              >
                {n} meses
              </Button>
            );
          })}
        </div>
        <PeriodoFiltro inicio={inicio} fim={fim} onChange={(i, f) => { setInicio(i); setFim(f); }} />
        <div className="flex justify-end">
          <Button variant="outline" className="h-11" onClick={() => setExportar(true)}>
            <FileDown /> Exportar PDF
          </Button>
        </div>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          <Skeleton className="h-64 rounded-2xl sm:col-span-3" />
        </div>
      ) : q.isError ? (
        <ErroCarregar msg={traduzirErro(q.error)} onRetry={() => q.refetch()} />
      ) : agg.meses.length === 0 ? (
        <EstadoVazio
          icon={<ClipboardPlus />}
          titulo="Nenhuma auditoria no período"
          texto="Registre os gastos do mês para acompanhar a evolução do salão."
          acao={<Button onClick={() => setNovo(true)}>Criar primeira auditoria</Button>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Resumo icon={<Wallet />} titulo="Gasto total no período" valor={formatBRL(agg.gastoTotal)} />
            <div className="card-soft p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4 text-primary" /> {agg.recente && formatMes(agg.recente.mes)}
              </div>
              <p className="mt-2 text-2xl font-bold">{formatBRL(agg.recente?.total ?? 0)}</p>
              {agg.variacao === null ? (
                <p className="mt-1 text-xs text-muted-foreground">Sem dados do mês anterior para comparar</p>
              ) : (
                <p className={`mt-1 flex items-center gap-1 text-sm font-medium ${agg.variacao <= 0 ? "text-success" : "text-destructive"}`}>
                  {agg.variacao <= 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  {Math.abs(agg.variacao).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. mês anterior
                </p>
              )}
            </div>
            <Resumo icon={<Trash2 />} titulo="Desperdício no período" valor={formatBRL(agg.desperdicioTotal)} />
            <Resumo
              icon={<Percent />}
              titulo="Desperdício sobre gasto com produtos"
              valor={formatPct(agg.pctDesperdicioProdutos)}
            />
          </div>

          <Grafico titulo="Gasto por mês">
            <BarChart data={meses}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rotulo" fontSize={12} />
              <YAxis tickFormatter={eixoBRL} fontSize={12} width={60} />
              <Tooltip formatter={tooltipBRL} />
              <Legend />
              <Bar dataKey="agua" name="Água" stackId="g" fill="var(--chart-1)" />
              <Bar dataKey="energia" name="Energia" stackId="g" fill="var(--chart-2)" />
              <Bar dataKey="produtos" name="Produtos" stackId="g" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </Grafico>

          <div className="grid gap-5 md:grid-cols-2">
            <Grafico titulo="Desperdício por mês">
              <LineChart data={meses}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rotulo" fontSize={12} />
                <YAxis tickFormatter={eixoBRL} fontSize={12} width={60} />
                <Tooltip content={<TooltipDesperdicio />} />
                <Legend />
                <Line dataKey="desperdicio" name="Desperdício" stroke="var(--chart-4)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </Grafico>
            <Grafico titulo="Desperdício por motivo">
              <BarChart data={agg.motivos}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="motivo" fontSize={11} interval={0} />
                <YAxis tickFormatter={eixoBRL} fontSize={12} width={60} />
                <Tooltip formatter={tooltipBRL} />
                <Legend />
                <Bar dataKey="valor" name="Valor desperdiçado" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </Grafico>
          </div>

          <section className="card-soft p-4">
            <h2 className="mb-3 font-semibold">Top 5 produtos desperdiçados</h2>
            {agg.topProdutos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum desperdício registrado no período. 🌱</p>
            ) : (
              <ol className="space-y-2">
                {agg.topProdutos.map((p, i) => (
                  <li key={p.produto} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-3">
                    <span className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                      {p.produto}
                    </span>
                    <span className="font-semibold">{formatBRL(p.valor)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <p className="text-center text-sm">
            <Link to="/auditorias" className="font-medium text-primary underline-offset-4 hover:underline">Ver auditorias</Link>
          </p>
        </>
      )}
      <AuditoriaForm open={novo} onOpenChange={setNovo} />
      <ExportarPdfDialog open={exportar} onOpenChange={setExportar} inicio={inicio} fim={fim} />
    </div>
  );
}

function Resumo({ icon, titulo, valor }: { icon: React.ReactNode; titulo: string; valor: string }) {
  return (
    <div className="card-soft p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary">
        {icon} {titulo}
      </div>
      <p className="mt-2 text-2xl font-bold">{valor}</p>
    </div>
  );
}

function Grafico({ titulo, children }: { titulo: string; children: React.ReactElement }) {
  return (
    <section className="card-soft p-4">
      <h2 className="mb-3 font-semibold">{titulo}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </section>
  );
}
