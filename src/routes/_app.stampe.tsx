import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Printer } from "lucide-react";
import {
  PageHeader,
  PageShell,
  StatCard,
  StatusPill,
  TableSurface,
} from "@/components/mes-ui";
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
    <PageShell>
      <PageHeader
        title="Coda stampa PLC"
        description="Job generati automaticamente dagli endpoint PLC per Mattoni e Tegole"
        action={<StatusPill icon={Clock}>Aggiornamento 5s</StatusPill>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          icon={Clock}
          label="In coda"
          value={String(data?.kpi.pending ?? 0)}
        />
        <StatCard
          icon={Printer}
          label="In stampa"
          value={String(data?.kpi.printing ?? 0)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Stampati"
          value={String(data?.kpi.printed ?? 0)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Errori"
          value={String(data?.kpi.failed ?? 0)}
        />
      </div>

      <TableSurface>
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
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Caricamento...
                </td>
              </tr>
            )}
            {(data?.jobs ?? []).map((job) => (
              <tr key={job.id} className="border-t border-border">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(job.created_at).toLocaleString("it-IT")}
                </td>
                <td className="px-4 py-2 font-semibold">
                  {job.line?.name ?? job.line_id}
                </td>
                <td className="px-4 py-2 font-mono">{job.label}</td>
                <td className="px-4 py-2 text-right font-semibold">
                  {job.quantity}
                </td>
                <td className="px-4 py-2">{job.printer_name}</td>
                <td className="px-4 py-2 capitalize">{job.status}</td>
              </tr>
            ))}
            {!isLoading && !data?.jobs.length && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nessun job di stampa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableSurface>
    </PageShell>
  );
}
