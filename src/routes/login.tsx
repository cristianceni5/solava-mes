import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FormField,
  PrimaryButton,
  SelectInput,
  TextInput,
} from "@/components/mes-ui";
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
  const { data: options } = useQuery({
    queryKey: ["mes-options"],
    queryFn: () => fetchOptions(),
  });
  const [matricola, setMatricola] = useState("");
  const [pin, setPin] = useState("");
  const [phaseId, setPhaseId] = useState("verde");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && employee) navigate({ to: "/" });
  }, [ready, employee, navigate]);

  useEffect(() => {
    const firstPhase = options?.phases[0]?.id;
    if (firstPhase && !options?.phases.some((phase) => phase.id === phaseId)) {
      setPhaseId(firstPhase);
    }
  }, [options?.phases, phaseId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matricola || !pin || !phaseId) return;
    setBusy(true);
    try {
      const res = await login({
        data: {
          matricola: matricola.trim(),
          pin: pin.trim(),
          phase_id: phaseId as never,
        },
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
      toast.error(
        "Problema: il MES non riesce a comunicare con il server. Codice errore: MES-RETE-LOGIN.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="mb-6">
          <img
            src="/brand/solava-logo.svg"
            alt="SOLAVA"
            className="h-10 w-auto"
          />
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Accesso MES
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Inserisci matricola, PIN e fase di lavoro.
          </p>
        </div>

        <div className="space-y-4">
          <FormField label="Matricola">
            <TextInput
              inputMode="numeric"
              autoComplete="off"
              value={matricola}
              onChange={(e) => setMatricola(e.target.value)}
              className="h-10"
              placeholder="1001"
            />
          </FormField>

          <FormField label="PIN">
            <TextInput
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-10 tracking-widest"
              placeholder="0000"
            />
          </FormField>

          <FormField label="Fase postazione">
            <SelectInput
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
              className="h-10"
            >
              {options?.phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>

        <PrimaryButton
          type="submit"
          disabled={busy}
          className="mt-6 h-11 w-full"
        >
          {busy ? "Accesso in corso..." : "Entra"}
        </PrimaryButton>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Demo locale: 1001/1234 · 1002/2345 · 1003/3456 · 9999/0000
        </div>
      </form>
    </div>
  );
}
