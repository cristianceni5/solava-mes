import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FormField,
  PageHeader,
  PageShell,
  SelectInput,
  Surface,
  TableSurface,
  TextInput,
} from "@/components/mes-ui";
import { getDiagnostics } from "@/lib/mes.functions";

export const Route = createFileRoute("/_app/diagnostica/log")({
  component: DiagnosticLogPage,
});

type LogType = "audit" | "plc" | "versamento" | "comunicazione";

type LogRow = {
  id: string;
  type: LogType;
  date: string;
  title: string;
  subject: string;
  detail: string;
  payload?: unknown;
};

function DiagnosticLogPage() {
  const fetchDiagnostics = useServerFn(getDiagnostics);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["diagnostics", "log"],
    queryFn: () => fetchDiagnostics(),
    refetchInterval: 5_000,
  });
  const [type, setType] = useState<LogType | "all">("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => buildLogRows(data), [data]);
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesType = type === "all" || row.type === type;
      const matchesSearch =
        !needle ||
        row.title.toLowerCase().includes(needle) ||
        row.subject.toLowerCase().includes(needle) ||
        row.detail.toLowerCase().includes(needle);
      return matchesType && matchesSearch;
    });
  }, [rows, search, type]);

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Log diagnostica"
        description="Tabella eventi: audit applicativo, eventi PLC e versamenti"
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-accent"
          >
            <RefreshCw
              className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Aggiorna
          </button>
        }
      />

      <DiagnosticsNav />

      <Surface>
        <div className="grid gap-3 md:grid-cols-[12rem_1fr]">
          <FormField label="Tipo evento">
            <SelectInput
              value={type}
              onChange={(event) =>
                setType(event.target.value as LogType | "all")
              }
            >
              <option value="all">Tutti</option>
              <option value="audit">Audit</option>
              <option value="plc">PLC</option>
              <option value="versamento">Versamenti</option>
              <option value="comunicazione">Comunicazioni</option>
            </SelectInput>
          </FormField>
          <FormField label="Cerca">
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Etichetta, azione, linea, codice..."
            />
          </FormField>
        </div>
      </Surface>

      <TableSurface>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Riferimento</th>
              <th className="px-4 py-3">Dettaglio</th>
              <th className="px-4 py-3">Payload</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={row.type} />
                </td>
                <td className="px-4 py-3 font-semibold">{row.title}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.subject}</td>
                <td className="px-4 py-3">{row.detail}</td>
                <td className="px-4 py-3">
                  {row.payload ? <PayloadDetails value={row.payload} /> : "-"}
                </td>
              </tr>
            ))}
            {!filteredRows.length && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nessun evento trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableSurface>
    </PageShell>
  );
}

function buildLogRows(
  data: Awaited<ReturnType<typeof getDiagnostics>> | undefined,
): LogRow[] {
  if (!data) return [];

  const auditRows: LogRow[] = data.recent.auditLog.map((row) => ({
    id: `audit-${row.id}`,
    type: "audit",
    date: row.created_at,
    title: row.action,
    subject: `${row.entity ?? "-"} / ${row.entity_id ?? "-"}`,
    detail: row.operator_id
      ? `Operatore ${row.operator_id}`
      : "Evento di sistema",
    payload: row.payload,
  }));

  const plcRows: LogRow[] = data.recent.plcEvents.map((row) => ({
    id: `plc-${row.id}`,
    type: "plc",
    date: row.received_at,
    title: row.label,
    subject: row.line_id,
    detail: `${row.quantity} pz - DatoPronte ${yesNo(row.dato_pronte)} - DatoLetto ${yesNo(row.dato_letto)}`,
    payload: row,
  }));

  const communicationRows: LogRow[] = data.production.lines.map((line) => {
    const hasHandshake = line.handshake.datoPronte && line.handshake.datoLetto;
    const hasEvent = Boolean(line.latestEvent);
    const status = hasHandshake && hasEvent ? "regolare" : "da verificare";

    return {
      id: `communication-${line.id}`,
      type: "comunicazione",
      date:
        line.handshake.updatedAt ??
        line.latestEvent?.received_at ??
        data.runtime.now,
      title: `${line.name} - comunicazione ${status}`,
      subject: line.id,
      detail: hasEvent
        ? `DatoPronte ${yesNo(line.handshake.datoPronte)} - DatoLetto ${yesNo(line.handshake.datoLetto)} - ultima etichetta ${line.latestEvent?.label ?? line.handshake.lastLabel ?? "-"}`
        : "Nessun evento PLC ricevuto per questa linea.",
      payload: {
        line_id: line.id,
        line_name: line.name,
        handshake: line.handshake,
        latestEvent: line.latestEvent,
      },
    };
  });

  const receiptRows: LogRow[] = data.recent.receipts.map((row) => ({
    id: `receipt-${row.id}`,
    type: "versamento",
    date: row.created_at,
    title: row.label,
    subject: row.phase?.name ?? row.phase_id,
    detail: `${row.line?.name ?? row.line_id} - ${row.quantity} pz`,
    payload: row,
  }));

  return [...communicationRows, ...auditRows, ...plcRows, ...receiptRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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

function TypeBadge({ type }: { type: LogType }) {
  const className =
    type === "audit"
      ? "bg-slate-100 text-slate-800"
      : type === "plc"
        ? "bg-sky-100 text-sky-800"
        : type === "comunicazione"
          ? "bg-amber-100 text-amber-800"
          : "bg-emerald-100 text-emerald-800";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      {type === "audit"
        ? "Audit"
        : type === "plc"
          ? "PLC"
          : type === "comunicazione"
            ? "Comunicazione"
            : "Versamento"}
    </span>
  );
}

function PayloadDetails({ value }: { value: unknown }) {
  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
        Apri
      </summary>
      <pre className="mt-2 max-h-56 min-w-72 overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("it-IT");
}

function yesNo(value: boolean) {
  return value ? "si" : "no";
}
