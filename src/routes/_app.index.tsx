import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  Database,
  PackageCheck,
  PackagePlus,
  Printer,
  Radio,
  Truck,
  Warehouse,
} from "lucide-react";
import {
  PageHeader,
  PageShell,
  StatCard,
  StatusPill,
  Surface,
} from "@/components/mes-ui";
import {
  getDiagnostics,
  getInventory,
  getPrintQueue,
} from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { employee } = useAuth();
  const fetchDiagnostics = useServerFn(getDiagnostics);
  const fetchPrintQueue = useServerFn(getPrintQueue);
  const fetchInventory = useServerFn(getInventory);

  const { data: diagnostics } = useQuery({
    queryKey: ["dashboard", "diagnostics"],
    queryFn: () => fetchDiagnostics(),
    refetchInterval: 5_000,
  });
  const { data: printQueue } = useQuery({
    queryKey: ["dashboard", "print-queue"],
    queryFn: () => fetchPrintQueue(),
    refetchInterval: 5_000,
  });
  const { data: inventory } = useQuery({
    queryKey: ["dashboard", "inventory"],
    queryFn: () => fetchInventory(),
    refetchInterval: 15_000,
  });

  const failedPrints = printQueue?.kpi.failed ?? 0;
  const pendingPrints = printQueue?.kpi.pending ?? 0;
  const inventoryAnomalies = inventory?.kpi.anomalies ?? 0;
  const sqlOk = diagnostics?.sql.ok ?? false;
  const openIssues =
    (sqlOk ? 0 : 1) +
    failedPrints +
    inventoryAnomalies +
    (diagnostics?.counters.duplicatePlcEvents ?? 0);

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Dashboard operativa"
        description={`Accesso rapido e stato impianto · ${employee?.full_name ?? "operatore"} · ${employee?.phase_name ?? "fase non selezionata"}`}
        action={<StatusPill icon={Radio}>Aggiornamento automatico</StatusPill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={AlertTriangle}
          label="Problemi aperti"
          value={String(openIssues)}
          tone={openIssues > 0 ? "error" : "ok"}
        />
        <StatCard
          icon={Database}
          label="SQL Server"
          value={sqlOk ? "OK" : "Errore"}
          tone={sqlOk ? "ok" : "error"}
        />
        <StatCard
          icon={Printer}
          label="Stampe in coda"
          value={String(pendingPrints)}
          tone={pendingPrints > 20 ? "warning" : "neutral"}
        />
        <StatCard
          icon={PackageCheck}
          label="Pacchi tracciati"
          value={String(inventory?.kpi.total ?? 0)}
        />
        <StatCard
          icon={Warehouse}
          label="Anomalie magazzino"
          value={String(inventoryAnomalies)}
          tone={inventoryAnomalies > 0 ? "error" : "neutral"}
        />
      </div>

      <Surface>
        <h2 className="mb-4 text-base font-semibold">Collegamenti rapidi</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <QuickLink
            to="/versamento"
            icon={PackagePlus}
            title="Versamento"
            description="Registra produzione e quantità"
          />
          <QuickLink
            to="/spedizioni"
            icon={Truck}
            title="Spedizioni e stampe"
            description="Bolle, carri, etichette e coda stampa"
          />
          <QuickLink
            to="/magazzino"
            icon={Warehouse}
            title="Magazzino"
            description="Pacchi, stato e posizione"
          />
          <QuickLink
            to="/ricettario"
            icon={BookOpen}
            title="Ricettario"
            description="Ricette e parametri linea"
          />
          <QuickLink
            to="/diagnostica/errori"
            icon={AlertTriangle}
            title="Errori"
            description="Anomalie e codici intervento"
            urgent={openIssues > 0}
          />
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface>
          <h2 className="mb-4 text-base font-semibold">Linee PLC</h2>
          <div className="grid gap-3">
            {(diagnostics?.production.lines ?? []).map((line) => {
              const ok = line.handshake.datoPronte && line.handshake.datoLetto;
              return (
                <div
                  key={line.id}
                  className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="font-semibold">{line.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Ultima etichetta:{" "}
                      <span className="font-mono">
                        {line.latestEvent?.label ??
                          line.handshake.lastLabel ??
                          "-"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Quantità:{" "}
                      {line.latestEvent?.quantity.toLocaleString("it-IT") ??
                        "-"}{" "}
                      pz
                    </div>
                  </div>
                  <StatusBadge tone={ok ? "ok" : "warning"}>
                    {ok ? "Handshake OK" : "Da verificare"}
                  </StatusBadge>
                </div>
              );
            })}
          </div>
        </Surface>

        <Surface>
          <h2 className="mb-4 text-base font-semibold">Cose da controllare</h2>
          <div className="space-y-3">
            <CheckRow
              label="Database"
              value={sqlOk ? "Connesso" : "Non connesso"}
              tone={sqlOk ? "ok" : "error"}
              to="/diagnostica/errori"
            />
            <CheckRow
              label="Stampe fallite"
              value={formatCount(failedPrints, "errore", "errori")}
              tone={failedPrints > 0 ? "error" : "ok"}
              to="/spedizioni"
            />
            <CheckRow
              label="Pacchi in anomalia"
              value={formatCount(inventoryAnomalies, "anomalia", "anomalie")}
              tone={inventoryAnomalies > 0 ? "error" : "ok"}
              to="/magazzino"
            />
            <CheckRow
              label="Duplicati PLC"
              value={formatCount(
                diagnostics?.counters.duplicatePlcEvents ?? 0,
                "duplicato",
                "duplicati",
              )}
              tone={
                (diagnostics?.counters.duplicatePlcEvents ?? 0) > 0
                  ? "warning"
                  : "ok"
              }
              to="/diagnostica/errori"
            />
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
  urgent = false,
}: {
  to: string;
  icon: typeof PackagePlus;
  title: string;
  description: string;
  urgent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`rounded-md border p-4 transition-colors hover:bg-accent ${
        urgent
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-background"
      }`}
    >
      <Icon
        className={`mb-3 h-5 w-5 ${urgent ? "text-destructive" : "text-primary"}`}
      />
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    </Link>
  );
}

function CheckRow({
  label,
  value,
  tone,
  to,
}: {
  label: string;
  value: string;
  tone: "ok" | "warning" | "error";
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 hover:bg-accent"
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-sm text-muted-foreground">{value}</div>
      </div>
      <StatusBadge tone={tone}>
        {tone === "ok" ? "OK" : tone === "warning" ? "Avviso" : "Errore"}
      </StatusBadge>
    </Link>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "ok" | "warning" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warning"
        ? "bg-amber-100 text-amber-800"
        : "bg-destructive/10 text-destructive";

  return (
    <span
      className={`inline-flex h-fit rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
