import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { mesParaData } from "@/lib/format";
import type { AuditoriaCompleta } from "@/lib/types";

interface Filtro {
  inicio: string; // AAAA-MM
  fim: string; // AAAA-MM
  incluirInativas?: boolean;
}

export function useAuditorias({ inicio, fim, incluirInativas = false }: Filtro) {
  return useQuery({
    queryKey: ["auditorias", inicio, fim, incluirInativas],
    queryFn: async () => {
      let q = supabase
        .from("auditorias")
        .select("*, consumos(*), desperdicios(*)")
        .gte("mes_referencia", mesParaData(inicio))
        .lte("mes_referencia", mesParaData(fim))
        .order("mes_referencia", { ascending: false })
        .order("criado_em", { ascending: false });
      if (!incluirInativas) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditoriaCompleta[];
    },
  });
}

export function useAuditoria(id: string) {
  return useQuery({
    queryKey: ["auditoria", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditorias")
        .select("*, consumos(*), desperdicios(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as AuditoriaCompleta | null;
    },
  });
}

export const totaisAuditoria = (a: AuditoriaCompleta) => ({
  gasto: a.consumos.reduce((s, c) => s + Number(c.valor_reais), 0),
  desperdicio: a.desperdicios.reduce((s, d) => s + Number(d.valor_estimado), 0),
});

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["auditorias"] });
    qc.invalidateQueries({ queryKey: ["auditoria"] });
  };
}

export function useCriarAuditoria() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { salao_id: string; mes: string; observacoes: string | null }) => {
      const { data, error } = await supabase
        .from("auditorias")
        .insert({ salao_id: v.salao_id, mes_referencia: mesParaData(v.mes), observacoes: v.observacoes })
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: inv,
  });
}

export function useEditarAuditoria() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; mes: string; observacoes: string | null }) => {
      const { error } = await supabase
        .from("auditorias")
        .update({ mes_referencia: mesParaData(v.mes), observacoes: v.observacoes })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}

export function useSetAtivo() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("auditorias").update({ ativo: v.ativo }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}
