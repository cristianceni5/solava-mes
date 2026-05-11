import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Factory, KeyRound, User } from "lucide-react";
import { getMesOptions, loginEmployee } from "@/lib/mes.functions";
import { setSession, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const login = useServerFn(loginEmployee);
  const fetchOptions = useServerFn(getMesOptions);
  const navigate = useNavigate();
  const { employee, ready } = useAuth();
  const { data: options } = useQuery({ queryKey: ["mes-options"], queryFn: () => fetchOptions() });
  const [matricola, setMatricola] = useState("");
  const [pin, setPin] = useState("");
  const [phaseId, setPhaseId] = useState("verde");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && employee) navigate({ to: "/" });
  }, [ready, employee, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matricola || !pin || !phaseId) return;
    setBusy(true);
    try {
      const res = await login({
        data: { matricola: matricola.trim(), pin: pin.trim(), phase_id: phaseId as never },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSession(res.employee);
      toast.success(`${res.employee.full_name} · ${res.employee.phase_name}`);
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error("Errore di rete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="grid w-full max-w-5xl gap-6 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:grid-cols-[360px_1fr]"
      >
        <div className="flex flex-col justify-between rounded-md bg-foreground p-6 text-background">
          <div>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Factory className="h-9 w-9" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">SO.LA.VA MES</h1>
            <p className="mt-3 text-sm text-background/70">
              Produzione laterizi in cotto · Linee Mattoni e Tegole
            </p>
          </div>
          <div className="mt-8 text-sm text-background/70">
            Demo locale: 1001/1234 · 1002/2345 · 1003/3456 · 9999/0000
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold">Accesso postazione</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Seleziona la fase di lavoro prima di entrare.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Matricola</span>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={matricola}
                  onChange={(e) => setMatricola(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="1001"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">PIN</span>
              <div className="relative">
                <KeyRound className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm tracking-widest outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="••••"
                />
              </div>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-medium">Fase postazione</div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {options?.phases.map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setPhaseId(phase.id)}
                  className={
                    phaseId === phase.id
                      ? "h-12 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow"
                      : "h-12 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
                  }
                >
                  {phase.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 h-11 w-full rounded-md bg-foreground text-sm font-semibold text-background shadow transition-opacity disabled:opacity-50"
          >
            {busy ? "Accesso in corso..." : "ENTRA"}
          </button>
        </div>
      </form>
    </div>
  );
}
