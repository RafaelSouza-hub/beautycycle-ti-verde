import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, ClipboardList, User, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useSalao } from "@/hooks/useSalao";

export const Route = createFileRoute("/_protegido")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/" });
  },
  component: Layout,
});

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/auditorias", label: "Auditorias", icon: ClipboardList },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

function Layout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: salao } = useSalao();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_OUT") {
        qc.clear();
        navigate({ to: "/", replace: true });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, qc]);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Logo />
            <p className="truncate pl-11 text-xs text-muted-foreground">{salao?.nome ?? " "}</p>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground hover:bg-accent"
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => supabase.auth.signOut()}>
            <LogOut />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
