import { Link, createFileRoute } from "@tanstack/react-router";
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
import {
  diagnosticErrorCodes,
  type DiagnosticErrorSeverity,
} from "@/lib/diagnostic-error-codes";

export const Route = createFileRoute("/_app/diagnostica/codici-errori")({
  component: DiagnosticErrorCodesPage,
});

function DiagnosticErrorCodesPage() {
  const [severity, setSeverity] = useState<DiagnosticErrorSeverity | "all">(
    "all",
  );
  const [area, setArea] = useState("all");
  const [search, setSearch] = useState("");

  const areas = useMemo(
    () => Array.from(new Set(diagnosticErrorCodes.map((item) => item.area))),
    [],
  );
  const filteredCodes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return diagnosticErrorCodes.filter((item) => {
      const matchesSeverity = severity === "all" || item.severity === severity;
      const matchesArea = area === "all" || item.area === area;
      const matchesSearch =
        !needle ||
        item.code.toLowerCase().includes(needle) ||
        item.problem.toLowerCase().includes(needle) ||
        item.meaning.toLowerCase().includes(needle) ||
        item.suggestedAction.toLowerCase().includes(needle);

      return matchesSeverity && matchesArea && matchesSearch;
    });
  }, [area, search, severity]);

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Codici errore"
        description="Legenda tecnica dei codici mostrati nelle anomalie diagnostiche"
      />

      <DiagnosticsNav />

      <Surface>
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <LegendItem
            severity="error"
            title="Errore"
            description="Errore bloccante o dato non affidabile"
          />
          <LegendItem
            severity="warning"
            title="Avviso"
            description="Avviso da controllare prima che diventi fermo"
          />
          <LegendItem
            severity="ok"
            title="OK"
            description="Codice di conferma o controllo regolare"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[12rem_14rem_1fr]">
          <FormField label="Gravità">
            <SelectInput
              value={severity}
              onChange={(event) =>
                setSeverity(
                  event.target.value as DiagnosticErrorSeverity | "all",
                )
              }
            >
              <option value="all">Tutte</option>
              <option value="error">Errore</option>
              <option value="warning">Avviso</option>
              <option value="ok">OK</option>
            </SelectInput>
          </FormField>
          <FormField label="Area">
            <SelectInput
              value={area}
              onChange={(event) => setArea(event.target.value)}
            >
              <option value="all">Tutte</option>
              {areas.map((item) => (
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
              placeholder="Codice, problema, significato..."
            />
          </FormField>
        </div>
      </Surface>

      <TableSurface>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Gravità</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Problema</th>
              <th className="px-4 py-3">Significato</th>
              <th className="px-4 py-3">Azione</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((item) => (
              <tr key={item.code} className="border-t border-border align-top">
                <td className="px-4 py-3 font-mono text-xs font-semibold">
                  {item.code}
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={item.severity} />
                </td>
                <td className="px-4 py-3 font-semibold">{item.area}</td>
                <td className="px-4 py-3 font-semibold">{item.problem}</td>
                <td className="px-4 py-3">{item.meaning}</td>
                <td className="px-4 py-3">{item.suggestedAction}</td>
              </tr>
            ))}
            {!filteredCodes.length && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nessun codice trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableSurface>
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

function LegendItem({
  severity,
  title,
  description,
}: {
  severity: DiagnosticErrorSeverity;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-1">
        <SeverityBadge severity={severity} label={title} />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SeverityBadge({
  severity,
  label,
}: {
  severity: DiagnosticErrorSeverity;
  label?: string;
}) {
  const defaultLabel =
    severity === "error" ? "Errore" : severity === "warning" ? "Avviso" : "OK";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${severityClassName(
        severity,
      )}`}
    >
      {label ?? defaultLabel}
    </span>
  );
}

function severityClassName(severity: DiagnosticErrorSeverity) {
  if (severity === "error") return "bg-destructive/10 text-destructive";
  if (severity === "warning") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}
