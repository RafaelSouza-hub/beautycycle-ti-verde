import type { ReactNode } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2 font-display font-bold text-primary">
      <span
        className={`bg-leaf grid place-items-center rounded-xl text-primary-foreground ${size === "lg" ? "h-12 w-12" : "h-9 w-9"}`}
      >
        <Leaf className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
      </span>
      <span className={size === "lg" ? "text-3xl" : "text-xl"}>BeautyCycle</span>
    </span>
  );
}

export function PeriodoFiltro({
  inicio,
  fim,
  onChange,
}: {
  inicio: string;
  fim: string;
  onChange: (inicio: string, fim: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label htmlFor="mes-inicio">Mês inicial</Label>
        <Input
          id="mes-inicio"
          type="month"
          className="h-11"
          value={inicio}
          max={fim}
          onChange={(e) => e.target.value && onChange(e.target.value, fim)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="mes-fim">Mês final</Label>
        <Input
          id="mes-fim"
          type="month"
          className="h-11"
          value={fim}
          min={inicio}
          onChange={(e) => e.target.value && onChange(inicio, e.target.value)}
        />
      </div>
    </div>
  );
}

export function EstadoVazio({
  icon,
  titulo,
  texto,
  acao,
}: {
  icon: ReactNode;
  titulo: string;
  texto?: string | undefined;
  acao?: ReactNode | undefined;
}) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{titulo}</h3>
      {texto && <p className="max-w-sm text-sm text-muted-foreground">{texto}</p>}
      {acao}
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex justify-center py-16 text-primary">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function ErroCarregar({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

export function Confirmar({
  open,
  onOpenChange,
  titulo,
  texto,
  confirmar,
  onConfirm,
  destrutivo = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  titulo: string;
  texto: string;
  confirmar: string;
  onConfirm: () => void;
  destrutivo?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={`h-11 ${destrutivo ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            onClick={onConfirm}
          >
            {confirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CampoErro({ msg }: { msg?: string | undefined }) {
  return msg ? <p className="text-sm text-destructive">{msg}</p> : null;
}
