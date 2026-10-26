import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Leaf, LogOut, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CampoErro, ErroCarregar } from "@/components/common";
import { useSalao, useUpdateSalao } from "@/hooks/useSalao";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toastErro, traduzirErro } from "@/lib/errors";

export const Route = createFileRoute("/_protegido/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — BeautyCycle" },
      { name: "description", content: "Dados do salão e da conta." },
      { property: "og:title", content: "Perfil — BeautyCycle" },
      { property: "og:description", content: "Dados do salão e da conta." },
    ],
  }),
  component: Perfil,
});

const campo = z.string().trim().max(150, "Texto muito longo");
const schema = z.object({
  nome: campo.min(1, "Informe o nome do salão"),
  responsavel: campo,
  bairro: campo,
  cidade: campo,
  telefone: z.string().trim().max(30, "Telefone muito longo").regex(/^[\d\s()+-]*$/, "Telefone inválido"),
});
type F = z.infer<typeof schema>;

const CAMPOS: { k: keyof F; label: string }[] = [
  { k: "nome", label: "Nome do salão" },
  { k: "responsavel", label: "Responsável" },
  { k: "bairro", label: "Bairro" },
  { k: "cidade", label: "Cidade" },
  { k: "telefone", label: "Telefone" },
];

function Perfil() {
  const q = useSalao();
  const { user } = useAuth();
  const upd = useUpdateSalao();
  const [editando, setEditando] = useState(false);
  const form = useForm<F>({ resolver: zodResolver(schema) });
  const s = q.data;

  useEffect(() => {
    if (s) form.reset({ nome: s.nome ?? "", responsavel: s.responsavel ?? "", bairro: s.bairro ?? "", cidade: s.cidade ?? "", telefone: s.telefone ?? "" });
  }, [s, editando, form]);

  const submit = form.handleSubmit(async (v) => {
    if (!s) return;
    try {
      await upd.mutateAsync({
        id: s.id,
        values: {
          nome: v.nome, responsavel: v.responsavel || null, bairro: v.bairro || null,
          cidade: v.cidade || null, telefone: v.telefone || null,
        },
      });
      toast.success("Dados do salão atualizados.");
      setEditando(false);
    } catch (e) {
      toastErro(e, () => submit());
    }
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <section className="card-soft p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Dados do salão</h2>
          {s && !editando && <Button variant="outline" size="sm" onClick={() => setEditando(true)}><Pencil /> Editar</Button>}
        </div>
        {q.isLoading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : q.isError ? (
          <ErroCarregar msg={traduzirErro(q.error)} onRetry={() => q.refetch()} />
        ) : !s ? (
          <p className="text-sm text-muted-foreground">Nenhum salão vinculado a esta conta.</p>
        ) : editando ? (
          <form onSubmit={submit} className="space-y-4">
            {CAMPOS.map((c) => (
              <div key={c.k} className="space-y-1">
                <Label htmlFor={c.k}>{c.label}</Label>
                <Input id={c.k} className="h-11" inputMode={c.k === "telefone" ? "tel" : undefined} {...form.register(c.k)} />
                <CampoErro msg={form.formState.errors[c.k]?.message} />
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditando(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={upd.isPending}>{upd.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            {CAMPOS.map((c) => (
              <div key={c.k}>
                <dt className="text-xs text-muted-foreground">{c.label}</dt>
                <dd className="font-medium">{s[c.k] || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card-soft space-y-3 p-5">
        <h2 className="font-semibold">Conta</h2>
        <p className="text-sm"><span className="text-muted-foreground">E-mail: </span>{user?.email ?? "—"}</p>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => supabase.auth.signOut()}>
          <LogOut /> Sair
        </Button>
      </section>

      <section className="card-soft space-y-2 bg-secondary p-5">
        <h2 className="flex items-center gap-2 font-semibold text-secondary-foreground"><Leaf className="h-5 w-5" /> Sobre o projeto</h2>
        <p className="text-sm text-secondary-foreground">
          O BeautyCycle é um projeto de extensão TI Verde (Trilha C: EcoTI Monitor) da UNIG EAD, criado para o
          Salão de Beleza Lucia, em Nova Cidade, Nilópolis/RJ. Ao monitorar água, energia, produtos e desperdícios,
          o salão reduz custos e impacto ambiental, em alinhamento com os ODS 12 (Consumo e Produção Responsáveis),
          13 (Ação Contra a Mudança Global do Clima) e 11 (Cidades e Comunidades Sustentáveis).
        </p>
      </section>
    </div>
  );
}
