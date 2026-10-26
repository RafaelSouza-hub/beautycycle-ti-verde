import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RelatorioGraficos, type GraficosHandle } from "@/components/RelatorioGraficos";
import { useAuditorias } from "@/hooks/useAuditorias";
import { useSalao } from "@/hooks/useSalao";
import { agregar } from "@/lib/dashboard";
import { deliverFile } from "@/lib/download";
import { dataParaMes } from "@/lib/format";
import { toastErro } from "@/lib/errors";
import type { AuditoriaCompleta } from "@/lib/types";
import type { ImagemGrafico } from "@/lib/relatorioPdf";

async function esperarDoisFrames() {
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export function ExportarPdfDialog({
  open,
  onOpenChange,
  inicio,
  fim,
  auditoria,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  inicio: string;
  fim: string;
  auditoria?: AuditoriaCompleta | undefined;
}) {
  const [incluirInativas, setIncluirInativas] = useState(false);
  const [gerando, setGerando] = useState(false);
  const handle = useRef<GraficosHandle>({
    gastoMes: null,
    desperdicioMes: null,
    desperdicioMotivo: null,
    topProdutos: null,
  });
  const salao = useSalao();
  const periodo = useAuditorias({ inicio, fim, incluirInativas: true });

  const auditorias = useMemo(
    () => (auditoria ? [auditoria] : (periodo.data ?? [])),
    [auditoria, periodo.data],
  );
  const agg = useMemo(() => agregar(auditorias, { incluirInativas: true }), [auditorias]);
  const carregando = auditoria ? false : periodo.isLoading;

  const gerar = async () => {
    setGerando(true);
    try {
      await esperarDoisFrames();
      const { capturarGraficos, gerarRelatorioPdf, nomeDoArquivo } = await import("@/lib/relatorioPdf");
      const imagens: ImagemGrafico[] = await capturarGraficos(handle.current);
      const blob = gerarRelatorioPdf({
        salaoNome: salao.data?.nome ?? "",
        auditorias,
        inicio,
        fim,
        incluirInativas: auditoria ? true : incluirInativas,
        imagens,
      });
      const nome = nomeDoArquivo({
        mes: auditoria ? dataParaMes(auditoria.mes_referencia) : undefined,
        inicio,
        fim,
      });
      await deliverFile(blob, nome);
      toast.success("PDF gerado");
      onOpenChange(false);
    } catch (e) {
      toastErro(e, gerar);
    } finally {
      setGerando(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Exportar relatório em PDF</DialogTitle>
            <DialogDescription>
              {auditoria
                ? "Gera o PDF somente desta auditoria."
                : "Gera o PDF do período selecionado, com resumo, gráficos e detalhamento."}
            </DialogDescription>
          </DialogHeader>

          {!auditoria && (
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="incluir-inativas-pdf"
                checked={incluirInativas}
                onCheckedChange={(v) => setIncluirInativas(v === true)}
              />
              <Label htmlFor="incluir-inativas-pdf" className="cursor-pointer">
                Incluir auditorias inativas
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="h-11" onClick={gerar} disabled={gerando || carregando}>
              {gerando ? <Loader2 className="animate-spin" /> : <FileDown />}
              {gerando ? "Gerando..." : "Gerar PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {open && (
        <RelatorioGraficos
          meses={agg.meses}
          motivos={agg.motivos}
          topProdutos={agg.topProdutos}
          handle={handle}
        />
      )}
    </>
  );
}
