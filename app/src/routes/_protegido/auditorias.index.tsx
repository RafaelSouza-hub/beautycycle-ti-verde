import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList, FileDown, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Confirmar, EstadoVazio, ErroCarregar, PeriodoFiltro } from "@/components/common";
import { AuditoriaForm } from "@/components/AuditoriaForm";
import { ExportarPdfDialog } from "@/components/ExportarPdfDialog";
import { totaisAuditoria, useAuditorias, useSetAtivo } from "@/hooks/useAuditorias";
import { formatBRL, formatMes, mesAtual, somarMeses } from "@/lib/format";
import { toastErro, traduzirErro } from "@/lib/errors";
import type { Auditoria } from "@/lib/types";

export const Route = createFileRoute("/_protegido/auditorias/")({
  head: () => ({
    meta: [
      { title: "Auditorias — BeautyCycle" },
      { name: "description", content: "Auditorias mensais de consumo e desperdício." },
      { property: "og:title", content: "Auditorias — BeautyCycle" },
      { property: "og:description", content: "Auditorias mensais de consumo e desperdício." },
    ],
  }),
  component: Auditorias,
});

function Auditorias() {
  const navigate = useNavigate();
  const [fim, setFim] = useState(mesAtual());
  const [inicio, setInicio] = useState(somarMeses(mesAtual(), -11));
  const [inativas, setInativas] = useState(false);
  const [form, setForm] = useState<{ open: boolean; a?: Auditoria | null }>({ open: false });
  const [exportar, setExportar] = useState(false);
  const [excluir, setExcluir] = useState<Auditoria | null>(null);
  const q = useAuditorias({ inicio, fim, incluirInativas: inativas });
  const setAtivo = useSetAtivo();

  const mudarAtivo = async (a: Auditoria, ativo: boolean) => {
    try {
      await setAtivo.mutateAsync({ id: a.id, ativo });
      toast.success(ativo ? "Auditoria reativada." : "Auditoria excluída.");
    } catch (e) {
      toastErro(e, () => mudarAtivo(a, ativo));
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Auditorias</h1>
      <div className="card-soft space-y-4 p-4">
        <PeriodoFiltro inicio={inicio} fim={fim} onChange={(i, f) => { setInicio(i); setFim(f); }} />
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Switch id="inativas" checked={inativas} onCheckedChange={setInativas} />
            <Label htmlFor="inativas">Mostrar inativas</Label>
          </div>
          <Button variant="outline" className="h-11" onClick={() => setExportar(true)}>
            <FileDown /> Exportar PDF
          </Button>
        </div>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : q.isError ? (
        <ErroCarregar msg={traduzirErro(q.error)} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EstadoVazio
          icon={<ClipboardList />}
          titulo="Nenhuma auditoria encontrada"
          texto="Ajuste o período ou crie uma nova auditoria."
          acao={<Button onClick={() => setForm({ open: true })}>Nova auditoria</Button>}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {q.data.map((a) => {
            const t = totaisAuditoria(a);
            return (
              <li key={a.id} className={`card-soft p-4 ${a.ativo ? "" : "opacity-60"}`}>
                <button
                  className="w-full text-left"
                  onClick={() => navigate({ to: "/auditorias/$id", params: { id: a.id } })}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{formatMes(a.mes_referencia)}</h2>
                    <Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativa" : "Inativa"}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Gasto</p><p className="font-semibold">{formatBRL(t.gasto)}</p></div>
                    <div><p className="text-muted-foreground">Desperdício</p><p className="font-semibold">{formatBRL(t.desperdicio)}</p></div>
                  </div>
                </button>
                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                  {a.ativo ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, a })}><Pencil /> Editar</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setExcluir(a)}><Trash2 /> Excluir</Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => mudarAtivo(a, true)}><RotateCcw /> Reativar</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        size="lg"
        className="fixed bottom-20 right-4 z-20 rounded-full shadow-lg md:bottom-8"
        onClick={() => setForm({ open: true })}
      >
        <Plus /> Nova auditoria
      </Button>

      <AuditoriaForm
        open={form.open}
        auditoria={form.a}
        onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
        onCreated={(id) => navigate({ to: "/auditorias/$id", params: { id } })}
      />
      <ExportarPdfDialog open={exportar} onOpenChange={setExportar} inicio={inicio} fim={fim} />
      <Confirmar
        open={!!excluir}
        onOpenChange={(o) => !o && setExcluir(null)}
        titulo="Excluir auditoria?"
        texto="A auditoria ficará inativa e não entrará nos gráficos. Você pode reativá-la depois."
        confirmar="Excluir"
        onConfirm={() => excluir && mudarAtivo(excluir, false)}
      />
    </div>
  );
}
