import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Droplets, FileDown, Package, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CampoErro, Confirmar, EstadoVazio, ErroCarregar } from "@/components/common";
import { AuditoriaForm } from "@/components/AuditoriaForm";
import { ExportarPdfDialog } from "@/components/ExportarPdfDialog";
import { totaisAuditoria, useAuditoria } from "@/hooks/useAuditorias";
import { useRemoverConsumo, useSalvarConsumo } from "@/hooks/useConsumos";
import { useRemoverDesperdicio, useSalvarDesperdicio } from "@/hooks/useDesperdicios";
import { dataParaMes, decimalField, formatBRL, formatMes, formatNum, numToInput, parseDecimal } from "@/lib/format";
import { toastErro, traduzirErro } from "@/lib/errors";
import {
  CONSUMO_INFO, MOTIVO_LABEL, type Consumo, type Desperdicio, type Motivo, type TipoConsumo,
} from "@/lib/types";

export const Route = createFileRoute("/_protegido/auditorias/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da auditoria — BeautyCycle" },
      { name: "description", content: "Consumos e desperdícios registrados no mês." },
      { property: "og:title", content: "Detalhe da auditoria — BeautyCycle" },
      { property: "og:description", content: "Consumos e desperdícios registrados no mês." },
    ],
  }),
  component: Detalhe,
});

const ICONES: Record<TipoConsumo, React.ReactNode> = {
  agua: <Droplets />,
  energia: <Zap />,
  produtos: <Package />,
};

function Detalhe() {
  const { id } = Route.useParams();
  const q = useAuditoria(id);
  const [editar, setEditar] = useState(false);
  const [exportar, setExportar] = useState(false);
  const [consumoForm, setConsumoForm] = useState<{ tipo: TipoConsumo; c?: Consumo } | null>(null);
  const [despForm, setDespForm] = useState<{ d?: Desperdicio } | null>(null);
  const [remConsumo, setRemConsumo] = useState<Consumo | null>(null);
  const [remDesp, setRemDesp] = useState<Desperdicio | null>(null);
  const removerC = useRemoverConsumo();
  const removerD = useRemoverDesperdicio();

  if (q.isLoading)
    return <div className="space-y-3"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  if (q.isError) return <ErroCarregar msg={traduzirErro(q.error)} onRetry={() => q.refetch()} />;
  const a = q.data;
  if (!a)
    return (
      <EstadoVazio
        icon={<AlertTriangle />}
        titulo="Auditoria não encontrada"
        acao={<Button asChild><Link to="/auditorias">Voltar</Link></Button>}
      />
    );

  const t = totaisAuditoria(a);
  const leitura = !a.ativo;

  const remover = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toastErro(e);
    }
  };

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/auditorias"><ArrowLeft /> Auditorias</Link>
      </Button>
      <section className="card-soft space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{formatMes(a.mes_referencia)}</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportar(true)}>
              <FileDown /> Exportar PDF desta auditoria
            </Button>
            {!leitura && (
              <Button variant="outline" size="sm" onClick={() => setEditar(true)}><Pencil /> Editar</Button>
            )}
          </div>
        </div>
        {a.observacoes && <p className="whitespace-pre-line text-sm text-muted-foreground">{a.observacoes}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">Gasto total</p><p className="text-lg font-bold">{formatBRL(t.gasto)}</p></div>
          <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Desperdício</p><p className="text-lg font-bold">{formatBRL(t.desperdicio)}</p></div>
        </div>
      </section>

      {leitura && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Esta auditoria está inativa. Os dados estão disponíveis somente para leitura.
        </div>
      )}

      <Tabs defaultValue="consumos">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="consumos" className="h-10 rounded-lg">Consumos</TabsTrigger>
          <TabsTrigger value="desperdicios" className="h-10 rounded-lg">Desperdícios</TabsTrigger>
        </TabsList>

        <TabsContent value="consumos" className="mt-4 grid gap-3 md:grid-cols-2">
          {(["agua", "energia"] as TipoConsumo[]).map((tipo) => {
            const info = CONSUMO_INFO[tipo];
            const c = a.consumos.find((x) => x.tipo === tipo);
            return (
              <div key={tipo} className="card-soft p-4">
                <div className="flex items-center gap-2 font-semibold [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-primary">
                  {ICONES[tipo]} {info.label}
                </div>
                {c ? (
                  <>
                    <p className="mt-2 text-2xl font-bold">{formatBRL(c.valor_reais)}</p>
                    <p className="text-sm text-muted-foreground">{formatNum(c.quantidade)} {info.unidadeLabel}</p>
                    {!leitura && (
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setConsumoForm({ tipo, c })}><Pencil /> Editar</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemConsumo(c)}><Trash2 /> Remover</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">Ainda não registrado.</p>
                    {!leitura && (
                      <Button className="mt-3 w-full" onClick={() => setConsumoForm({ tipo })}><Plus /> Registrar</Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {(() => {
            const info = CONSUMO_INFO.produtos;
            const entradas = a.consumos.filter((x) => x.tipo === "produtos");
            const totalValor = entradas.reduce((s, x) => s + Number(x.valor_reais), 0);
            const totalQtd = entradas.reduce((s, x) => s + Number(x.quantidade), 0);
            return (
              <div className="card-soft p-4 md:col-span-2">
                <div className="flex items-center gap-2 font-semibold [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-primary">
                  {ICONES.produtos} {info.label}
                </div>
                {entradas.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">Ainda não registrado.</p>
                    {!leitura && (
                      <Button className="mt-3 w-full sm:w-auto" onClick={() => setConsumoForm({ tipo: "produtos" })}><Plus /> Registrar</Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">Total em Reais</p><p className="text-lg font-bold">{formatBRL(totalValor)}</p></div>
                      <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Total de Quantidades</p><p className="text-lg font-bold">{formatNum(totalQtd)} {info.unidadeLabel}</p></div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {entradas.map((c) => (
                        <li key={c.id} className="rounded-xl bg-muted p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{c.produto?.trim() || "Produto sem nome"}</p>
                              <p className="text-sm text-muted-foreground">{formatNum(c.quantidade)} {info.unidadeLabel}</p>
                            </div>
                            <p className="text-lg font-bold">{formatBRL(c.valor_reais)}</p>
                          </div>
                          {!leitura && (
                            <div className="mt-2 flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setConsumoForm({ tipo: "produtos", c })}><Pencil /> Editar</Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemConsumo(c)}><Trash2 /> Remover</Button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    {!leitura && (
                      <Button className="mt-3 w-full sm:w-auto" onClick={() => setConsumoForm({ tipo: "produtos" })}><Plus /> Adicionar compra de produtos</Button>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="desperdicios" className="mt-4 space-y-3">
          {!leitura && (
            <Button className="w-full sm:w-auto" onClick={() => setDespForm({})}><Plus /> Adicionar desperdício</Button>
          )}
          {a.desperdicios.length === 0 ? (
            <EstadoVazio icon={<Package />} titulo="Nenhum desperdício registrado" texto="Ótimo sinal! Registre aqui sobras, produtos vencidos ou erros de mistura." />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {a.desperdicios.map((d) => (
                <li key={d.id} className="card-soft p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{d.produto}</p>
                      <p className="text-sm text-muted-foreground">{formatNum(d.quantidade)} {d.unidade}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{MOTIVO_LABEL[d.motivo]}</span>
                  </div>
                  <p className="mt-2 text-lg font-bold">{formatBRL(d.valor_estimado)}</p>
                  {!leitura && (
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDespForm({ d })}><Pencil /> Editar</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemDesp(d)}><Trash2 /> Remover</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <AuditoriaForm open={editar} onOpenChange={setEditar} auditoria={a} />
      <ExportarPdfDialog
        open={exportar}
        onOpenChange={setExportar}
        inicio={dataParaMes(a.mes_referencia)}
        fim={dataParaMes(a.mes_referencia)}
        auditoria={a}
      />
      <ConsumoDialog auditoriaId={a.id} state={consumoForm} existentes={a.consumos} onClose={() => setConsumoForm(null)} />
      <DesperdicioDialog auditoriaId={a.id} state={despForm} onClose={() => setDespForm(null)} />
      <Confirmar
        open={!!remConsumo}
        onOpenChange={(o) => !o && setRemConsumo(null)}
        titulo="Remover consumo?"
        texto="Este registro será apagado definitivamente."
        confirmar="Remover"
        onConfirm={() => remConsumo && remover(() => removerC.mutateAsync(remConsumo.id), "Consumo removido.")}
      />
      <Confirmar
        open={!!remDesp}
        onOpenChange={(o) => !o && setRemDesp(null)}
        titulo="Remover desperdício?"
        texto="Este registro será apagado definitivamente."
        confirmar="Remover"
        onConfirm={() => remDesp && remover(() => removerD.mutateAsync(remDesp.id), "Desperdício removido.")}
      />
    </div>
  );
}

const consumoSchema = z.object({
  produto: z.string().trim().max(120, "Máximo de 120 caracteres"),
  valor: decimalField,
  quantidade: decimalField,
});

function ConsumoDialog({
  auditoriaId, state, existentes, onClose,
}: {
  auditoriaId: string;
  state: { tipo: TipoConsumo; c?: Consumo } | null;
  existentes: Consumo[];
  onClose: () => void;
}) {
  const salvar = useSalvarConsumo();
  const form = useForm<z.infer<typeof consumoSchema>>({ resolver: zodResolver(consumoSchema), defaultValues: { produto: "", valor: "", quantidade: "" } });
  useEffect(() => {
    if (state) form.reset({ produto: state.c?.produto ?? "", valor: state.c ? numToInput(state.c.valor_reais) : "", quantidade: state.c ? numToInput(state.c.quantidade) : "" });
  }, [state, form]);
  if (!state) return null;
  const info = CONSUMO_INFO[state.tipo];
  const ehProdutos = state.tipo === "produtos";

  const submit = form.handleSubmit(async (v) => {
    if (ehProdutos && !v.produto) {
      form.setError("produto", { message: "Informe o nome do produto" });
      return;
    }
    if (!ehProdutos && !state.c && existentes.some((x) => x.tipo === state.tipo)) {
      toast.error(`Já existe um consumo de ${info.label} nesta auditoria.`);
      return;
    }
    try {
      await salvar.mutateAsync({
        id: state.c?.id, auditoria_id: auditoriaId, tipo: state.tipo,
        valor_reais: parseDecimal(v.valor), quantidade: parseDecimal(v.quantidade),
        produto: ehProdutos ? v.produto.trim() : null,
      });
      toast.success("Consumo salvo.");
      onClose();
    } catch (e) {
      toastErro(e, () => submit());
    }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>{info.label}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {ehProdutos && (
            <div className="space-y-1">
              <Label htmlFor="produto-consumo">Nome do produto</Label>
              <Input id="produto-consumo" maxLength={120} placeholder="Ex.: Shampoo neutro" className="h-11" {...form.register("produto")} />
              <CampoErro msg={form.formState.errors.produto?.message} />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input id="valor" inputMode="decimal" placeholder="0,00" className="h-11" {...form.register("valor")} />
            <CampoErro msg={form.formState.errors.valor?.message} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qtd">Quantidade ({info.unidadeLabel})</Label>
            <Input id="qtd" inputMode="decimal" placeholder="0" className="h-11" {...form.register("quantidade")} />
            <CampoErro msg={form.formState.errors.quantidade?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const despSchema = z.object({
  produto: z.string().trim().min(1, "Informe o produto").max(200, "Nome muito longo"),
  quantidade: decimalField,
  unidade: z.enum(["g", "ml", "unidades"], { errorMap: () => ({ message: "Escolha a unidade" }) }),
  valor: decimalField,
  motivo: z.enum(["sobra", "validade", "erro_mistura", "outro"], { errorMap: () => ({ message: "Escolha o motivo" }) }),
});
type DespF = z.infer<typeof despSchema>;

function DesperdicioDialog({
  auditoriaId, state, onClose,
}: { auditoriaId: string; state: { d?: Desperdicio } | null; onClose: () => void }) {
  const salvar = useSalvarDesperdicio();
  const form = useForm<DespF>({ resolver: zodResolver(despSchema) });
  useEffect(() => {
    if (state) {
      const d = state.d;
      form.reset({
        produto: d?.produto ?? "",
        quantidade: d ? numToInput(d.quantidade) : "",
        unidade: d?.unidade ?? "unidades",
        valor: d ? numToInput(d.valor_estimado) : "",
        motivo: d?.motivo ?? "sobra",
      });
    }
  }, [state, form]);
  if (!state) return null;

  const submit = form.handleSubmit(async (v) => {
    try {
      await salvar.mutateAsync({
        id: state.d?.id, auditoria_id: auditoriaId, produto: v.produto.trim(),
        quantidade: parseDecimal(v.quantidade), unidade: v.unidade,
        valor_estimado: parseDecimal(v.valor), motivo: v.motivo,
      });
      toast.success("Desperdício salvo.");
      onClose();
    } catch (e) {
      toastErro(e, () => submit());
    }
  });
  const er = form.formState.errors;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>{state.d ? "Editar desperdício" : "Adicionar desperdício"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="produto">Produto</Label>
            <Input id="produto" className="h-11" placeholder="Ex.: Tintura castanho" {...form.register("produto")} />
            <CampoErro msg={er.produto?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dq">Quantidade</Label>
              <Input id="dq" inputMode="decimal" className="h-11" {...form.register("quantidade")} />
              <CampoErro msg={er.quantidade?.message} />
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Controller control={form.control} name="unidade" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Unidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="unidades">unidades</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              <CampoErro msg={er.unidade?.message} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dv">Valor estimado (R$)</Label>
            <Input id="dv" inputMode="decimal" placeholder="0,00" className="h-11" {...form.register("valor")} />
            <CampoErro msg={er.valor?.message} />
          </div>
          <div className="space-y-1">
            <Label>Motivo</Label>
            <Controller control={form.control} name="motivo" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Motivo" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(MOTIVO_LABEL) as Motivo[]).map((m) => (
                    <SelectItem key={m} value={m}>{MOTIVO_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            <CampoErro msg={er.motivo?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
