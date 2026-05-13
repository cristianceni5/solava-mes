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

export const Route = createFileRoute("/_app/diagnostica/errori")({
  component: DiagnosticErrorsPage,
});

type CheckLevel = "ok" | "warning" | "error";

type CheckItem = {
  category: string;
  title: string;
  detail: string;
  code: string;
  level: CheckLevel;
  action?: string;
};

function DiagnosticErrorsPage() {
  const fetchDiagnostics = useServerFn(getDiagnostics);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["diagnostics", "errors"],
    queryFn: () => fetchDiagnostics(),
    refetchInterval: 5_000,
  });
  const [level, setLevel] = useState<CheckLevel | "all">("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const checks = useMemo(() => buildCheckList(data), [data]);
  const categories = useMemo(
    () => Array.from(new Set(checks.map((item) => item.category))),
    [checks],
  );
  const filteredChecks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return checks.filter((item) => {
      const matchesLevel = level === "all" || item.level === level;
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch =
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.detail.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle);
      return matchesLevel && matchesCategory && matchesSearch;
    });
  }, [category, checks, level, search]);

  const errors = checks.filter((item) => item.level === "error").length;
  const warnings = checks.filter((item) => item.level === "warning").length;
  const ok = checks.filter((item) => item.level === "ok").length;

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Errori e anomalie"
        description="Tabella controlli: Errore blocca, Avviso da verificare, OK regolare"
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
        <div className="mb-4 flex items-start justify-between">
          <div className="flex flex-wrap content-start gap-2">
            <StatusCount
              level="error"
              value={errors}
              singular="errore"
              plural="errori"
            />
            <StatusCount
              level="warning"
              value={warnings}
              singular="avviso"
              plural="avvisi"
            />
            <StatusCount
              level="ok"
              value={ok}
              singular="controllo regolare"
              plural="controlli regolari"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[12rem_14rem_1fr]">
          <FormField label="Stato">
            <SelectInput
              value={level}
              onChange={(event) =>
                setLevel(event.target.value as CheckLevel | "all")
              }
            >
              <option value="all">Tutti</option>
              <option value="error">Errore</option>
              <option value="warning">Avviso</option>
              <option value="ok">OK</option>
            </SelectInput>
          </FormField>
          <FormField label="Categoria">
            <SelectInput
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">Tutte</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Cerca">
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Problema, codice errore, categoria..."
            />
          </FormField>
        </div>
      </Surface>

      <TableSurface>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Problema</th>
              <th className="px-4 py-3">Dettaglio</th>
              <th className="px-4 py-3">Azione consigliata</th>
              <th className="px-4 py-3">Codice</th>
            </tr>
          </thead>
          <tbody>
            {filteredChecks.map((item) => (
              <tr
                key={`${item.category}-${item.code}`}
                className={rowClassName(item.level)}
              >
                <td className="px-4 py-3">
                  <LevelBadge level={item.level} />
                </td>
                <td className="px-4 py-3 font-semibold">{item.category}</td>
                <td className="px-4 py-3 font-semibold">{item.title}</td>
                <td className="px-4 py-3">{item.detail}</td>
                <td className="px-4 py-3">{item.action ?? "-"}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold">
                  {item.code}
                </td>
              </tr>
            ))}
            {!filteredChecks.length && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nessun controllo trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableSurface>
    </PageShell>
  );
}

function buildCheckList(
  data: Awaited<ReturnType<typeof getDiagnostics>> | undefined,
): CheckItem[] {
  if (!data) return [];

  const items: CheckItem[] = [];
  const pendingPrints = data.printQueue.pending.length;
  const failedPrints = data.printQueue.failed.length;
  const anomalies = data.inventory.anomalies.length;
  const duplicates = data.counters.duplicatePlcEvents;

  items.push({
    category: "Database",
    title: "Connessione Supabase",
    level: data.supabase.ok ? "ok" : "error",
    code: data.supabase.ok
      ? "DB-OK"
      : extractErrorCode(data.supabase.message, "DB-CONFIG-MANCANTE"),
    detail: data.supabase.ok
      ? `Database raggiungibile: ${data.supabase.database ?? "supabase"}`
      : (data.supabase.message ??
        "Problema: connessione Supabase non configurata."),
    action: data.supabase.ok
      ? undefined
      : databaseAction(data.supabase.message),
  });

  data.production.lines.forEach((line) => {
    const hasHandshake = line.handshake.datoPronte && line.handshake.datoLetto;
    const hasEvent = Boolean(line.latestEvent);
    if (hasHandshake && hasEvent) return;

    items.push({
      category: "PLC",
      title: `${line.name} - problema comunicazione`,
      level: hasEvent ? "warning" : "error",
      code: hasEvent ? "PLC-HANDSHAKE" : "PLC-NESSUN-DATO",
      detail: hasEvent
        ? `Evento presente ma handshake incompleto: DatoPronte ${yesNo(line.handshake.datoPronte)}, DatoLetto ${yesNo(line.handshake.datoLetto)}.`
        : "Problema: nessun evento PLC disponibile per questa linea.",
      action:
        "Controlla endpoint PLC, rete macchina e handshake DatoPronte/DatoLetto.",
    });
  });

  items.push({
    category: "PLC",
    title: "Duplicati eventi PLC",
    level: duplicates > 0 ? "warning" : "ok",
    code: duplicates > 0 ? "PLC-DUPLICATO" : "PLC-DUPLICATI-OK",
    detail:
      duplicates > 0
        ? `${formatCount(duplicates, "evento duplicato rilevato", "eventi duplicati rilevati")} nella finestra di deduplica.`
        : "Nessun duplicato PLC rilevato.",
    action:
      duplicates > 0
        ? "Verifica se il PLC reinvia la stessa etichetta senza reset corretto."
        : undefined,
  });

  items.push({
    category: "Stampa",
    title: "Job di stampa falliti",
    level: failedPrints > 0 ? "error" : "ok",
    code: failedPrints > 0 ? "STAMPA-FALLITA" : "STAMPA-OK",
    detail:
      failedPrints > 0
        ? `${formatCount(failedPrints, "etichetta risulta", "etichette risultano")} in errore.`
        : "Nessuna stampa fallita.",
    action:
      failedPrints > 0
        ? "Controlla stampante, coda Windows, consumabili e collegamento di rete."
        : undefined,
  });

  items.push({
    category: "Stampa",
    title: "Coda stampa in attesa",
    level: pendingPrints > 20 ? "warning" : "ok",
    code: pendingPrints > 20 ? "STAMPA-CODA-ALTA" : "STAMPA-CODA-OK",
    detail:
      pendingPrints > 20
        ? `${formatCount(pendingPrints, "etichetta è", "etichette sono")} in attesa: la coda sta crescendo.`
        : `${formatCount(pendingPrints, "etichetta in attesa", "etichette in attesa")}.`,
    action:
      pendingPrints > 20
        ? "Verifica velocità stampante e servizio che consuma la coda."
        : undefined,
  });

  items.push({
    category: "Magazzino",
    title: "Pacchi in anomalia",
    level: anomalies > 0 ? "error" : "ok",
    code: anomalies > 0 ? "MAGAZZINO-PACCO-ANOMALO" : "MAGAZZINO-OK",
    detail:
      anomalies > 0
        ? `${formatCount(anomalies, "pacco è marcato", "pacchi sono marcati")} come anomalia.`
        : "Nessun pacco in anomalia.",
    action:
      anomalies > 0
        ? "Apri Magazzino e verifica stato, posizione ed etichetta del pacco."
        : undefined,
  });

  items.push({
    category: "Magazzino",
    title: "Pacchi tracciati",
    level: data.counters.inventoryPackages > 0 ? "ok" : "warning",
    code:
      data.counters.inventoryPackages > 0
        ? "MAGAZZINO-TRACCIAMENTO-OK"
        : "MAGAZZINO-NESSUN-PACCO",
    detail:
      data.counters.inventoryPackages > 0
        ? `${formatCount(data.counters.inventoryPackages, "pacco presente", "pacchi presenti")} nel tracciamento.`
        : "Nessun pacco tracciato: corretto solo se il sistema è appena avviato.",
    action:
      data.counters.inventoryPackages > 0
        ? undefined
        : "Invia un evento PLC di test o verifica la ricezione dalla linea.",
  });

  items.push({
    category: "Log e audit",
    title: "Audit operazioni",
    level: data.counters.auditEntries > 0 ? "ok" : "warning",
    code: data.counters.auditEntries > 0 ? "AUDIT-OK" : "AUDIT-VUOTO",
    detail:
      data.counters.auditEntries > 0
        ? `${formatCount(data.counters.auditEntries, "operazione registrata", "operazioni registrate")}.`
        : "Nessuna operazione audit registrata in questa sessione.",
    action:
      data.counters.auditEntries > 0
        ? undefined
        : "Esegui login o movimento pacco e verifica che compaia un log.",
  });

  items.push({
    category: "Applicazione",
    title: "Server MES",
    level: "ok",
    code: "MES-SERVER-OK",
    detail: `Processo attivo da ${formatUptime(data.runtime.uptimeSeconds)}.`,
  });

  return items;
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

function LegendItem({
  level,
  title,
  description,
}: {
  level: CheckLevel;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-1">
        <LevelBadge level={level} label={title} />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function StatusCount({
  level,
  value,
  singular,
  plural,
}: {
  level: CheckLevel;
  value: number;
  singular: string;
  plural: string;
}) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${levelClassName(
        level,
      )}`}
    >
      {formatCount(value, singular, plural)}
    </span>
  );
}

function LevelBadge({ level, label }: { level: CheckLevel; label?: string }) {
  const defaultLabel =
    level === "error" ? "Errore" : level === "warning" ? "Avviso" : "OK";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${levelClassName(level)}`}
    >
      {label ?? defaultLabel}
    </span>
  );
}

function levelClassName(level: CheckLevel) {
  if (level === "error") return "bg-destructive/10 text-destructive";
  if (level === "warning") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function rowClassName(level: CheckLevel) {
  if (level === "error") return "border-t border-border bg-destructive/5";
  if (level === "warning") return "border-t border-border bg-amber-50/80";
  return "border-t border-border bg-emerald-50/70";
}

function databaseAction(message: string | undefined) {
  const code = extractErrorCode(message, "DB-CONFIG-MANCANTE");
  if (code === "DB-SCHEMA-INCOMPLETO") {
    return "Esegui tutto db/schema.sql e guarda il dettaglio Mancano nella diagnostica.";
  }
  if (code === "DB-PGRST202") {
    return "La funzione esiste solo dopo il nuovo schema: riesegui db/schema.sql e ricarica la schema cache Supabase.";
  }
  if (code === "DB-42P01") {
    return "Manca una tabella o vista: riesegui db/schema.sql nel progetto Supabase indicato dal file .env.";
  }
  if (code === "DB-RETE") {
    return "Verifica SUPABASE_URL, rete/DNS e riavvia il dev server dopo modifiche al file .env.";
  }
  if (code === "DB-42501") {
    return "Verifica SUPABASE_PRIVATE_KEY/service role e policy RLS.";
  }
  return "Verifica il dettaglio errore Supabase mostrato sopra e riavvia il dev server se hai appena aggiornato schema o .env.";
}

function extractErrorCode(message: string | undefined, fallback: string) {
  const match = message?.match(/Codice errore:\s*([A-Z0-9-]+)/);
  return match?.[1] ?? fallback;
}

function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function yesNo(value: boolean) {
  return value ? "si" : "no";
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
