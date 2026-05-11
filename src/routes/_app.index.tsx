import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock, PackageCheck, Printer } from "lucide-react";
import { confirmPhaseReceipt, getPhaseWorkstation } from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/")({
  component: WorkstationPage,
});

type WorkstationLine = {
  id: "mattoni" | "tegole";
  name: string;
  output: string;
  printer: string;
  handshake: {
    datoPronte: boolean;
    datoLetto: boolean;
    lastLabel: string | null;
    updatedAt: string | null;
  };
  latestEvent: {
    id: string;
    quantity: number;
    label: string;
    received_at: string;
  } | null;
  receipt: { id: string; created_at: string } | null;
  printJob: {
    status: "pending" | "printing" | "printed" | "failed";
    attempts: number;
    error_code: string | null;
    error_message: string | null;
  } | null;
};

function WorkstationPage() {
  const { employee } = useAuth();
  const qc = useQueryClient();
  const fetchWorkstation = useServerFn(getPhaseWorkstation);
  const confirmReceipt = useServerFn(confirmPhaseReceipt);

  const { data, isLoading } = useQuery({
    queryKey: ["workstation", employee?.phase_id],
    queryFn: () => fetchWorkstation({ data: { phase_id: employee!.phase_id as never } }),
    enabled: !!employee,
    refetchInterval: 2_000,
  });

  async function onConfirm(line: WorkstationLine) {
    if (!employee || !line.latestEvent) return;
    const res = await confirmReceipt({
      data: {
        employee_id: employee.id,
        phase_id: employee.phase_id as never,
        line_id: line.id,
        plc_event_id: line.latestEvent.id,
      },
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Versamento registrato · ${line.name}`);
    qc.invalidateQueries({ queryKey: ["workstation", employee.phase_id] });
  }

  const lines = (data?.lines ?? []) as WorkstationLine[];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-primary uppercase">
              Postazione
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {employee?.phase_name ?? data?.phase?.name}
            </h1>
          </div>
          <div className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Aggiornamento PLC ogni 2s
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {lines.map((line) => (
          <LineCard key={line.id} line={line} busy={isLoading} onConfirm={() => onConfirm(line)} />
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 text-sm font-semibold">Ultimi versamenti della fase</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(data?.recentReceipts ?? []).map((receipt) => (
            <div key={receipt.id} className="rounded-md border border-border bg-background p-3">
              <div className="text-sm font-semibold">{receipt.line?.name}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{receipt.label}</div>
              <div className="mt-1.5 text-lg font-bold text-primary">
                {receipt.quantity.toLocaleString("it-IT")} pz
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(receipt.created_at).toLocaleString("it-IT")}
              </div>
            </div>
          ))}
          {!data?.recentReceipts?.length && (
            <div className="text-sm text-muted-foreground">
              Nessun versamento registrato in questa fase.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LineCard({
  line,
  busy,
  onConfirm,
}: {
  line: WorkstationLine;
  busy: boolean;
  onConfirm: () => void;
}) {
  const canConfirm = !!line.latestEvent && !line.receipt;

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{line.name}</h2>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Uscita {line.output}
          </div>
        </div>
        <HandshakeBadge ready={line.handshake.datoPronte} read={line.handshake.datoLetto} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel icon={PackageCheck} label="Quantità PLC">
          {line.latestEvent ? `${line.latestEvent.quantity.toLocaleString("it-IT")} pz` : "-"}
        </Panel>
        <Panel icon={Clock} label="Etichetta lotto">
          {line.latestEvent?.label ?? "-"}
        </Panel>
      </div>

      <div className="mt-4 rounded-md border border-border bg-background p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Printer className="h-4 w-4 text-primary" />
          Stampante dedicata
        </div>
        <div className="text-base font-bold">{line.printer}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Stato job: {line.printJob ? printStatusLabel(line.printJob.status) : "nessun job"}
        </div>
        {line.printJob?.error_message && (
          <div className="mt-2 rounded-md bg-destructive/10 p-3 text-base font-semibold text-destructive">
            {line.printJob.error_code ?? "ERRORE"} · {line.printJob.error_message}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canConfirm || busy}
        onClick={onConfirm}
        className={
          canConfirm
            ? "mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-primary text-base font-bold text-primary-foreground shadow"
            : "mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-muted text-base font-bold text-muted-foreground"
        }
      >
        <CheckCircle2 className="h-5 w-5" />
        {line.receipt ? "VERSATO" : "VERSA ALLA FASE"}
      </button>
    </section>
  );
}

function Panel({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof PackageCheck;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="break-words text-xl font-bold">{children}</div>
    </div>
  );
}

function HandshakeBadge({ ready, read }: { ready: boolean; read: boolean }) {
  const label = ready && read ? "Dato letto" : ready ? "Dato pronto" : "Reset";
  const cls =
    ready && read
      ? "bg-emerald-100 text-emerald-800"
      : ready
        ? "bg-amber-100 text-amber-800"
        : "bg-muted text-muted-foreground";
  return <div className={`rounded-md px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</div>;
}

function printStatusLabel(status: WorkstationLine["printJob"]["status"]) {
  if (status === "pending") return "in coda";
  if (status === "printing") return "in stampa";
  if (status === "printed") return "stampato";
  return "errore";
}
