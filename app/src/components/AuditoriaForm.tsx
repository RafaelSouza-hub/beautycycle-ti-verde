import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CampoErro } from "@/components/common";
import { useCriarAuditoria, useEditarAuditoria } from "@/hooks/useAuditorias";
import { useSalao } from "@/hooks/useSalao";
import { dataParaMes, mesAtual } from "@/lib/format";
import { toastErro } from "@/lib/errors";
import type { Auditoria } from "@/lib/types";

const schema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Escolha o mês e o ano"),
  observacoes: z.string().max(1000, "Máximo de 1000 caracteres").optional(),
});
type F = z.infer<typeof schema>;

export function AuditoriaForm({
  open,
  onOpenChange,
  auditoria,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  auditoria?: Auditoria | null | undefined;
  onCreated?: (id: string) => void;
}) {
  const { data: salao } = useSalao();
  const criar = useCriarAuditoria();
  const editar = useEditarAuditoria();
  const form = useForm<F>({ resolver: zodResolver(schema), defaultValues: { mes: mesAtual(), observacoes: "" } });

  useEffect(() => {
    if (open)
      form.reset({
        mes: auditoria ? dataParaMes(auditoria.mes_referencia) : mesAtual(),
        observacoes: auditoria?.observacoes ?? "",
      });
  }, [open, auditoria, form]);

  const submit = form.handleSubmit(async (v) => {
    const obs = v.observacoes?.trim() || null;
    try {
      if (auditoria) {
        await editar.mutateAsync({ id: auditoria.id, mes: v.mes, observacoes: obs });
        toast.success("Auditoria atualizada.");
      } else {
        if (!salao) {
          toast.error("Salão não encontrado para esta conta.");
          return;
        }
        const r = await criar.mutateAsync({ salao_id: salao.id, mes: v.mes, observacoes: obs });
        toast.success("Auditoria criada.");
        onCreated?.(r.id);
      }
      onOpenChange(false);
    } catch (e) {
      toastErro(e, () => submit());
    }
  });

  const pending = criar.isPending || editar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{auditoria ? "Editar auditoria" : "Nova auditoria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="mes">Mês/ano de referência</Label>
            <Input id="mes" type="month" className="h-11" {...form.register("mes")} />
            <CampoErro msg={form.formState.errors.mes?.message} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea id="obs" rows={3} {...form.register("observacoes")} />
            <CampoErro msg={form.formState.errors.observacoes?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
