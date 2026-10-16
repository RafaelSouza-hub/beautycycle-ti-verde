import { toast } from "sonner";

type AnyErr = { code?: string; message?: string; status?: number } | null | undefined;

export function traduzirErro(err: unknown): string {
  const e = err as AnyErr;
  const msg = (e?.message || "").toLowerCase();
  if (e?.code === "23505") return "Já existe uma auditoria ativa para este mês.";
  if (e?.code === "23514") return "Valor inválido. Confira os campos.";
  if (
    e?.code === "42501" ||
    e?.code === "PGRST301" ||
    msg.includes("row-level security") ||
    msg.includes("permission")
  )
    return "Você não tem permissão para esta ação.";
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (isRede(err)) return "Não foi possível conectar. Verifique sua internet.";
  return "Algo deu errado. Tente novamente.";
}

export function isRede(err: unknown) {
  const msg = ((err as AnyErr)?.message || "").toLowerCase();
  return (
    err instanceof TypeError ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed")
  );
}

export function toastErro(err: unknown, retry?: () => void) {
  toast.error(traduzirErro(err), {
    action: retry && isRede(err) ? { label: "Tentar novamente", onClick: retry } : undefined,
  });
}
