import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Printer } from "lucide-react";
import { getPrintQueue } from "@/lib/mes.functions";

export const Route = createFileRoute("/_app/stampe")({
  component: CodaStampa,
});

function CodaStampa() {
  const fetchQueue = useServerFn(getPrintQueue);
  const { data, isLoading } = useQuery({
    queryKey: ["print-queue"],
    queryFn: () => fetchQueue(),
    refetchInterval: 5_000,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coda stampa PLC</h1>
          <p className="text-sm text-muted-foreground">
            Job generati automaticamente dagli endpoint PLC per Mattoni e Tegole
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 text-primary" />
          Aggiornamento 5s
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat icon={Clock} label="In coda" value={String(data?.kpi.pending ?? 0)} />
        <Stat icon={Printer} label="In stampa" value={String(data?.kpi.printing ?? 0)} />
        <Stat icon={CheckCircle2} label="Stampati" value={String(data?.kpi.printed ?? 0)} />
        <Stat icon={AlertTriangle} label="Errori" value={String(data?.kpi.failed ?? 0)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Linea</th>
              <th className="px-4 py-3">Etichetta</th>
              <th className="px-4 py-3 text-right">Quantità</th>
              <th className="px-4 py-3">Stampante</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Caricamento...
                </td>
              </tr>
            )}
            {(data?.jobs ?? []).map((job) => (
              <tr key={job.id} className="border-t border-border">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(job.created_at).toLocaleString("it-IT")}
                </td>
                <td className="px-4 py-2 font-semibold">{job.line?.name ?? job.line_id}</td>
                <td className="px-4 py-2 font-mono">{job.label}</td>
                <td className="px-4 py-2 text-right font-semibold">{job.quantity}</td>
                <td className="px-4 py-2">{job.printer_name}</td>
                <td className="px-4 py-2 capitalize">{job.status}</td>
              </tr>
            ))}
            {!isLoading && !data?.jobs.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nessun job di stampa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
