import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Motivo, UnidadeDesperdicio } from "@/lib/types";

function useInv() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["auditoria"] });
    qc.invalidateQueries({ queryKey: ["auditorias"] });
  };
}

export interface DesperdicioInput {
  id?: string | undefined;
  auditoria_id: string;
  produto: string;
  quantidade: number;
  unidade: UnidadeDesperdicio;
  valor_estimado: number;
  motivo: Motivo;
}

export function useSalvarDesperdicio() {
  const inv = useInv();
  return useMutation({
    mutationFn: async ({ id, ...payload }: DesperdicioInput) => {
      const { error } = id
        ? await supabase.from("desperdicios").update(payload).eq("id", id)
        : await supabase.from("desperdicios").insert(payload);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}

export function useRemoverDesperdicio() {
  const inv = useInv();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("desperdicios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });
}
