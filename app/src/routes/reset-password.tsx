import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoErro, Logo } from "@/components/common";
import { supabase } from "@/lib/supabase";
import { isRede } from "@/lib/errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — BeautyCycle" },
      { name: "description", content: "Defina uma nova senha para sua conta BeautyCycle." },
      { property: "og:title", content: "Redefinir senha — BeautyCycle" },
      { property: "og:description", content: "Defina uma nova senha para sua conta BeautyCycle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

export const schemaNovaSenha = z
  .object({
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmar: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((v) => v.senha === v.confirmar, { message: "As senhas não são iguais", path: ["confirmar"] });

function traduzirErroSenha(err: unknown) {
  const e = err as { message?: string; code?: string } | null;
  const msg = (e?.message || "").toLowerCase();
  if (e?.code === "same_password" || msg.includes("different from the old")) return "A nova senha deve ser diferente da anterior.";
  if (e?.code === "weak_password" || msg.includes("weak") || msg.includes("pwned")) return "Senha fraca ou já exposta em vazamentos. Escolha outra.";
  if (msg.includes("session") || msg.includes("jwt") || msg.includes("expired")) return "Link inválido ou expirado. Solicite uma nova recuperação de senha.";
  if (isRede(err)) return "Não foi possível conectar. Verifique sua internet.";
  return "Não foi possível alterar a senha. Tente novamente.";
}

type Estado = "verificando" | "pronto" | "invalido" | "sucesso";

function ResetPassword() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schemaNovaSenha>>({
    resolver: zodResolver(schemaNovaSenha),
    defaultValues: { senha: "", confirmar: "" },
  });

  useEffect(() => {
    const url = window.location.hash + window.location.search;
    const temLink = /type=recovery|code=|access_token=/.test(url);
    const temErro = /error=|error_code=/.test(url);
    let liberado = false;
    const liberar = () => {
      liberado = true;
      setEstado((s) => (s === "verificando" || s === "invalido" ? "pronto" : s));
    };
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "PASSWORD_RECOVERY" || (temLink && s && e === "SIGNED_IN")) liberar();
    });
    if (temErro) setEstado("invalido");
    else {
      supabase.auth.getSession().then(({ data: d }) => {
        if (d.session && temLink) liberar();
      });
    }
    const t = window.setTimeout(() => {
      if (!liberado) setEstado("invalido");
    }, temLink && !temErro ? 5000 : 1500);
    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  const submit = form.handleSubmit(async (v) => {
    setErro(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: v.senha });
      if (error) return setErro(traduzirErroSenha(error));
      setEstado("sucesso");
      toast.success("Senha alterada com sucesso");
      await supabase.auth.signOut();
      navigate({ to: "/", search: { senha: "alterada" }, replace: true });
    } catch (e) {
      setErro(traduzirErroSenha(e));
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" />
        </div>
        <div className="card-soft space-y-4 p-6">
          <h1 className="text-xl font-semibold">Redefinir senha</h1>
          {estado === "verificando" && (
            <div className="flex justify-center py-6 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {estado === "invalido" && (
            <>
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                Link inválido ou expirado. Solicite uma nova recuperação de senha.
              </p>
              <Button asChild className="w-full">
                <Link to="/esqueci-senha">Solicitar novo link</Link>
              </Button>
            </>
          )}
          {estado === "sucesso" && <p className="rounded-lg bg-secondary p-3 text-sm">Senha alterada com sucesso</p>}
          {estado === "pronto" && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="senha">Nova senha</Label>
                <div className="relative">
                  <Input id="senha" type={ver ? "text" : "password"} autoComplete="new-password" className="h-11 pr-12" {...form.register("senha")} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11"
                    aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setVer((x) => !x)}
                  >
                    {ver ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <CampoErro msg={form.formState.errors.senha?.message} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmar">Confirmar nova senha</Label>
                <Input id="confirmar" type={ver ? "text" : "password"} autoComplete="new-password" className="h-11" {...form.register("confirmar")} />
                <CampoErro msg={form.formState.errors.confirmar?.message} />
              </div>
              {erro && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
          <Link to="/" className="block text-center text-sm font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  );
}
