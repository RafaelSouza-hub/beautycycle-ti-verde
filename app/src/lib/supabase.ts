import { createClient } from "@supabase/supabase-js";

// Projeto Supabase existente "beautycycle". A chave publishable é pública por design.
const url =
  (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ||
  "https://txnsqyiywhudbxibnnqe.supabase.co";
const key =
  (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ||
  "sb_publishable_ehd1Z2kzCPJZDtz7FFoOwg_7WuqzPo-";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
