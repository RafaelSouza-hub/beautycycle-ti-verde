import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Salao } from "@/lib/types";

export function useSalao() {
  return useQuery({
    queryKey: ["salao"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salao").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as Salao | null;
    },
    staleTime: 5 * 60_000,
  });
}

export type SalaoUpdate = Pick<Salao, "nome" | "responsavel" | "bairro" | "cidade" | "telefone">;

export function useUpdateSalao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SalaoUpdate }) => {
      const { error } = await supabase.from("salao").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salao"] }),
  });
}
