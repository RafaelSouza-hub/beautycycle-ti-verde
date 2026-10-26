import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CONSUMO_INFO, type TipoConsumo } from "@/lib/types";

function useInv() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["auditoria"] });
    qc.invalidateQueries({ queryKey: ["auditorias"] });
  };
}

export function useSalvarConsumo() {
  const inv = useInv();
  return useMutation({
    mutationFn: async (v: {
      id?: string | undefined;
      auditoria_id: string;
      tipo: TipoConsumo;
      valor_reais: number;
      quantidade: number;
      produto?: string | null;
    }) => {
      const payload = {
        auditoria_id: v.auditoria_id,
        tipo: v.tipo,
        unidade: CONSUMO_INFO[v.tipo].unidade,
        valor_reais: v.valor_reais,
        quantidade: v.quantidade,
        produto: v.tipo === "produtos" ? (v.produto ?? null) : null,
      };
      const { error } = v.id
        ? await supabase.from("consumos").update(payload).eq("id", v.id)
        : await supabase.from("consumos").insert(payload);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}

export function useRemoverConsumo() {
  const inv = useInv();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consumos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}
