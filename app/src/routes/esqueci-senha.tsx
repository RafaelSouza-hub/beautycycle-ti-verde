import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoErro, Logo } from "@/components/common";
import { supabase } from "@/lib/supabase";
import { isRede } from "@/lib/errors";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Esqueci minha senha — BeautyCycle" },
      { name: "description", content: "Receba um link para redefinir sua senha do BeautyCycle." },
      { property: "og:title", content: "Esqueci minha senha — BeautyCycle" },
      { property: "og:description", content: "Receba um link para redefinir sua senha do BeautyCycle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EsqueciSenha,
});

const schema = z.object({ email: z.string().min(1, "Informe o e-mail").email("E-mail inválido") });

export const MSG_ENVIADO =
  "Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Verifique também a caixa de spam.";
export const MSG_LIMITE = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

export function isRateLimit(err: unknown) {
  const e = err as { status?: number; code?: string; message?: string } | null;
  const msg = (e?.message || "").toLowerCase();
  return e?.status === 429 || (e?.code ?? "").includes("rate_limit") || msg.includes("rate limit") || msg.includes("too many");
}

function EsqueciSenha() {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const submit = form.handleSubmit(async (v) => {
    setErro(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(v.email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error && isRateLimit(error)) return setErro(MSG_LIMITE);
      if (error && isRede(error)) return setErro("Não foi possível conectar. Verifique sua internet.");
      setEnviado(true);
    } catch (e) {
      setErro(isRede(e) ? "Não foi possível conectar. Verifique sua internet." : "Algo deu errado. Tente novamente.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" />
        </div>
        <form onSubmit={submit} className="card-soft space-y-4 p-6">
          <h1 className="text-xl font-semibold">Esqueci minha senha</h1>
          {enviado ? (
            <p className="rounded-lg bg-secondary p-3 text-sm">{MSG_ENVIADO}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Informe seu e-mail para receber o link de recuperação.</p>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" className="h-11" {...form.register("email")} />
                <CampoErro msg={form.formState.errors.email?.message} />
              </div>
              {erro && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </>
          )}
          <Link to="/" className="block text-center text-sm font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </form>
      </div>
    </main>
  );
}
