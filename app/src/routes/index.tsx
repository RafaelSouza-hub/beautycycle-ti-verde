import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoErro, Logo } from "@/components/common";
import { supabase } from "@/lib/supabase";
import { traduzirErro } from "@/lib/errors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — BeautyCycle" },
      { name: "description", content: "Monitor de gastos e desperdício do Salão de Beleza Lucia." },
      { property: "og:title", content: "Entrar — BeautyCycle" },
      { property: "og:description", content: "Monitor de gastos e desperdício do Salão de Beleza Lucia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

function Login() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", senha: "" } });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  const submit = form.handleSubmit(async (v) => {
    setErro(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: v.email.trim(), password: v.senha });
      if (error) {
        setErro(traduzirErro(error));
        return;
      }
      navigate({ to: "/inicio", replace: true });
    } catch (e) {
      setErro(traduzirErro(e));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground">Menos desperdício, mais beleza sustentável.</p>
        </div>
        <form onSubmit={submit} className="card-soft space-y-4 p-6">
          <h1 className="text-xl font-semibold">Entrar</h1>
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" className="h-11" {...form.register("email")} />
            <CampoErro msg={form.formState.errors.email?.message} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" autoComplete="current-password" className="h-11" {...form.register("senha")} />
            <CampoErro msg={form.formState.errors.senha?.message} />
          </div>
          {erro && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">Projeto de extensão TI Verde · UNIG EAD</p>
      </div>
    </main>
  );
}
