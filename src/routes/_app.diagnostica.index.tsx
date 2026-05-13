import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Network,
  Radio,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  PageHeader,
  PageShell,
  StatCard,
  StatusPill,
  Surface,
} from "@/components/mes-ui";
import { getDiagnostics } from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/diagnostica/")({
  component: DiagnosticaPage,
});

type DiagnosticStatus = "ok" | "warning" | "error";

function DiagnosticaPage() {
  const { employee } = useAuth();
  const fetchDiagnostics = useServerFn(getDiagnostics);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: () => fetchDiagnostics(),
    refetchInterval: 5_000,
  });

  const dbOk = data?.supabase.ok ?? data?.sql.ok ?? false;
  const anomalies = data?.inventory.anomalies.length ?? 0;
  const failedPrints = data?.printQueue.failed.length ?? 0;
  const duplicateEvents = data?.counters.duplicatePlcEvents ?? 0;

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Dashboard diagnostica"
        description="Stato tecnico del MES, collegamenti, code, eventi e dati utili al debug"
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <RefreshCw
              className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Aggiorna
          </button>
        }
      />

      <DiagnosticsNav />

      {error && (
        <Surface className="border-destructive bg-destructive/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Errore caricamento diagnostica
          </div>
          <pre className="mt-3 overflow-auto rounded-md bg-background p-3 text-xs">
            {formatUnknown(error)}
          </pre>
        </Surface>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Database}
          label="Supabase"
          value={
            dbOk
              ? "OK"
              : data?.supabase.configured
                ? "Errore"
                : "Non configurato"
          }
          tone={dbOk ? "ok" : "error"}
        />
        <StatCard
          icon={Radio}
          label="Eventi PLC"
          value={String(data?.counters.plcEvents ?? 0)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalie"
          value={String(anomalies + failedPrints + duplicateEvents)}
        />
        <StatCard
          icon={Clock}
          label="Uptime"
          value={formatUptime(data?.runtime.uptimeSeconds ?? 0)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface>
          <SectionTitle icon={Server} title="Runtime e configurazione" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoRow label="Ambiente" value={data?.runtime.mode ?? "-"} />
            <InfoRow label="Node" value={data?.runtime.node ?? "-"} />
            <InfoRow
              label="Processo"
              value={String(data?.runtime.pid ?? "-")}
            />
            <InfoRow
              label="Piattaforma"
              value={joinValues(data?.runtime.platform, data?.runtime.arch)}
            />
            <InfoRow
              label="Avvio"
              value={formatDate(data?.runtime.startedAt)}
            />
            <InfoRow label="Ora server" value={formatDate(data?.runtime.now)} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <StatusPanel
              title="Database"
              status={dbOk ? "ok" : "error"}
              detail={sqlDetail(data)}
            />
            <StatusPanel
              title="Sessione browser"
              status={employee ? "ok" : "warning"}
              detail={
                employee
                  ? `${employee.full_name} - ${employee.phase_name}`
                  : "Nessuna sessione"
              }
            />
          </div>
        </Surface>

        <Surface>
          <SectionTitle icon={Network} title="Endpoint PLC" />
          <div className="space-y-3">
            {(data?.configuration.plcEndpoints ?? []).map((endpoint) => (
              <div
                key={endpoint.line_id}
                className="rounded-md border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {endpoint.line_name}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {endpoint.method} {endpoint.endpoint}
                    </div>
                  </div>
                  <StatusPill>
                    porta {data?.configuration.plcHttpPort}
                  </StatusPill>
                </div>
                <JsonBlock
                  title="Payload esempio"
                  value={endpoint.payload}
                  compact
                />
              </div>
            ))}
            {!data?.configuration.plcEndpoints?.length && (
              <EmptyState
                loading={isLoading}
                label="Nessun endpoint PLC rilevato"
              />
            )}
          </div>
        </Surface>
      </div>

      <Surface>
        <SectionTitle icon={Activity} title="Linee e handshake" />
        <div className="grid gap-4 xl:grid-cols-2">
          {(data?.production.lines ?? []).map((line) => (
            <div
              key={line.id}
              className="rounded-md border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{line.name}</h2>
                  <div className="text-sm text-muted-foreground">
                    Uscita {line.output} - stampante {line.printer}
                  </div>
                </div>
                <HealthBadge
                  status={
                    line.handshake.datoPronte && line.handshake.datoLetto
                      ? "ok"
                      : "warning"
                  }
                  label={line.handshake.datoPronte ? "Dato pronto" : "Reset"}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InfoRow
                  label="DatoPronte"
                  value={String(line.handshake.datoPronte)}
                />
                <InfoRow
                  label="DatoLetto"
                  value={String(line.handshake.datoLetto)}
                />
                <InfoRow
                  label="Ultima etichetta"
                  value={line.handshake.lastLabel ?? "-"}
                />
              </div>
              <JsonBlock
                title="Ultimo evento PLC"
                value={line.latestEvent ?? { message: "Nessun evento" }}
              />
            </div>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-3">
        <DiagnosticList
          title="Pacchi magazzino"
          rows={data?.inventory.packages ?? []}
          initialLimit={8}
          getKey={(row) => row.id}
          render={(row) => (
            <>
              <div className="font-mono text-sm font-semibold">{row.code}</div>
              <div className="text-xs text-muted-foreground">
                {row.line?.name ?? row.line_id} - {row.quantity} pz -{" "}
                {row.status}
              </div>
            </>
          )}
        />
        <DiagnosticList
          title="Coda stampa"
          rows={data?.printQueue.recent ?? []}
          initialLimit={8}
          getKey={(row) => row.id}
          render={(row) => (
            <>
              <div className="font-mono text-sm font-semibold">{row.label}</div>
              <div className="text-xs text-muted-foreground">
                {row.printer_name} - {row.status} - tentativi {row.attempts}
              </div>
            </>
          )}
        />
        <DiagnosticList
          title="Audit log"
          rows={data?.recent.auditLog ?? []}
          initialLimit={8}
          getKey={(row) => row.id}
          render={(row) => (
            <>
              <div className="text-sm font-semibold">{row.action}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {row.entity ?? "-"} / {row.entity_id ?? "-"}
              </div>
            </>
          )}
        />
      </div>

      <Surface>
        <SectionTitle icon={Database} title="Snapshot completo" />
        <JsonBlock
          title="Apri dati diagnostici completi"
          value={data ?? { loading: isLoading }}
        />
      </Surface>
    </PageShell>
  );
}

function DiagnosticsNav() {
  return (
    <div className="flex flex-wrap gap-2">
      <DiagnosticNavLink to="/diagnostica" label="Dashboard" />
      <DiagnosticNavLink to="/diagnostica/log" label="Log" />
      <DiagnosticNavLink to="/diagnostica/errori" label="Errori" />
      <DiagnosticNavLink
        to="/diagnostica/codici-errori"
        label="Codici errore"
      />
    </div>
  );
}

function DiagnosticNavLink({
  to,
  label,
}: {
  to:
    | "/diagnostica"
    | "/diagnostica/log"
    | "/diagnostica/errori"
    | "/diagnostica/codici-errori";
  label: string;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{
        className:
          "rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground",
      }}
      inactiveProps={{
        className:
          "rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent",
      }}
    >
      {label}
    </Link>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Activity;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-1 break-words font-mono text-sm">{value}</div>
    </div>
  );
}

function StatusPanel({
  title,
  status,
  detail,
}: {
  title: string;
  status: DiagnosticStatus;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{title}</div>
        <HealthBadge status={status} label={statusLabel(status)} />
      </div>
      <div className="mt-2 break-words text-sm text-muted-foreground">
        {detail}
      </div>
    </div>
  );
}

function HealthBadge({
  status,
  label,
}: {
  status: DiagnosticStatus;
  label: string;
}) {
  const Icon = status === "ok" ? CheckCircle2 : AlertTriangle;
  const className =
    status === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : status === "warning"
        ? "bg-amber-100 text-amber-800"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function DiagnosticList<T>({
  title,
  rows,
  initialLimit = 10,
  getKey,
  render,
}: {
  title: string;
  rows: T[];
  initialLimit?: number;
  getKey: (row: T) => string;
  render: (row: T) => React.ReactNode;
}) {
  const visibleRows = rows.slice(0, initialLimit);
  const hiddenRows = rows.slice(initialLimit);

  return (
    <Surface>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <StatusPill>{formatCount(rows.length, "record", "record")}</StatusPill>
      </div>
      <div className="space-y-2">
        {visibleRows.map((row) => (
          <DiagnosticListRow key={getKey(row)}>{render(row)}</DiagnosticListRow>
        ))}
        {hiddenRows.length > 0 && (
          <details className="rounded-md border border-border bg-background">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              Mostra{" "}
              {formatCount(hiddenRows.length, "altro record", "altri record")}
            </summary>
            <div className="max-h-80 space-y-2 overflow-auto border-t border-border p-3">
              {hiddenRows.map((row) => (
                <DiagnosticListRow key={getKey(row)}>
                  {render(row)}
                </DiagnosticListRow>
              ))}
            </div>
          </details>
        )}
        {!rows.length && <EmptyState label="Nessun dato disponibile" />}
      </div>
    </Surface>
  );
}

function DiagnosticListRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      {children}
    </div>
  );
}

function JsonBlock({
  title,
  value,
  compact = false,
}: {
  title: string;
  value: unknown;
  compact?: boolean;
}) {
  return (
    <details className="mt-3 rounded-md border border-border bg-background">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        {title}
      </summary>
      <pre
        className={
          compact
            ? "max-h-40 overflow-auto border-t border-border bg-muted p-3 text-xs"
            : "max-h-[32rem] overflow-auto border-t border-border bg-muted p-4 text-xs"
        }
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function formatUnknown(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function EmptyState({ loading, label }: { loading?: boolean; label: string }) {
  return (
    <div className="text-sm text-muted-foreground">
      {loading ? "Caricamento..." : label}
    </div>
  );
}

function statusLabel(status: DiagnosticStatus) {
  if (status === "ok") return "OK";
  if (status === "warning") return "Attenzione";
  return "Errore";
}

function sqlDetail(
  data: Awaited<ReturnType<typeof getDiagnostics>> | undefined,
) {
  if (!data) return "-";
  const db = data.supabase ?? data.sql;
  if (db.ok) {
    return `Supabase ${db.database ?? "-"} - schema OK - server time ${formatDate(db.serverTime)}`;
  }
  return db.message ?? "Connessione Supabase non disponibile";
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("it-IT");
}

function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function joinValues(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" / ") || "-";
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
