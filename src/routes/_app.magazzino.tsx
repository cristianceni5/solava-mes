import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ClipboardList,
  PackageCheck,
  PackageX,
  Radio,
} from "lucide-react";
import {
  FormField,
  PageHeader,
  PageShell,
  PrimaryButton,
  SelectInput,
  StatCard,
  StatusPill,
  Surface,
  TextInput,
} from "@/components/mes-ui";
import { getInventory, updateInventory } from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/magazzino")({
  component: MagazzinoPage,
});

type PackageStatus = "in_stock" | "in_lavorazione" | "spedito" | "anomalia";

type InventoryPackage = {
  id: string;
  code: string;
  line_id: "mattoni" | "tegole";
  quantity: number;
  status: PackageStatus;
  location: string | null;
  created_at: string;
  updated_at: string;
  line?: { name: string } | null;
};

const statusOptions: { value: PackageStatus; label: string }[] = [
  { value: "in_stock", label: "In magazzino" },
  { value: "in_lavorazione", label: "In lavorazione" },
  { value: "spedito", label: "Spedito" },
  { value: "anomalia", label: "Anomalia" },
];

function MagazzinoPage() {
  const { employee } = useAuth();
  const qc = useQueryClient();
  const fetchInventory = useServerFn(getInventory);
  const submitUpdate = useServerFn(updateInventory);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<PackageStatus>("in_stock");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => fetchInventory(),
    refetchInterval: 10_000,
  });

  const packages = (data?.packages ?? []) as InventoryPackage[];
  const selectedPackage = packages.find((item) => item.id === selectedId);

  function onSelectPackage(packageId: string) {
    const pkg = packages.find((item) => item.id === packageId);
    setSelectedId(packageId);
    setStatus(pkg?.status ?? "in_stock");
    setLocation(pkg?.location ?? "");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!employee || !selectedId) {
      toast.error("Seleziona un pacco da aggiornare");
      return;
    }

    setSubmitting(true);
    const res = await submitUpdate({
      data: {
        package_id: selectedId,
        operator_id: employee.id,
        status,
        location: location || null,
      },
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Pacco aggiornato e tracciato");
    qc.invalidateQueries({ queryKey: ["inventory"] });
  }

  return (
    <PageShell>
      <PageHeader
        title="Magazzino"
        description="Tracciamento pacchi generati dal PLC, con storico operazioni append-only"
        action={<StatusPill icon={Radio}>Sync 10s</StatusPill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={PackageCheck}
          label="In magazzino"
          value={String(data?.kpi.inStock ?? 0)}
        />
        <StatCard
          icon={ClipboardList}
          label="In lavorazione"
          value={String(data?.kpi.inProgress ?? 0)}
        />
        <StatCard
          icon={PackageCheck}
          label="Spediti"
          value={String(data?.kpi.shipped ?? 0)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalie"
          value={String(data?.kpi.anomalies ?? 0)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Surface>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Pacchi tracciati</h2>
            <StatusPill>{packages.length} record</StatusPill>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4">Pacco</th>
                  <th className="py-2 pr-4">Linea</th>
                  <th className="py-2 pr-4 text-right">Pezzi</th>
                  <th className="py-2 pr-4">Stato</th>
                  <th className="py-2 pr-4">Posizione</th>
                  <th className="py-2 pr-4">Aggiornato</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Caricamento...
                    </td>
                  </tr>
                )}
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/40"
                    onClick={() => onSelectPackage(pkg.id)}
                  >
                    <td className="py-2 pr-4 font-mono font-semibold">
                      {pkg.code}
                    </td>
                    <td className="py-2 pr-4">
                      {pkg.line?.name ?? pkg.line_id}
                    </td>
                    <td className="py-2 pr-4 text-right font-semibold">
                      {pkg.quantity.toLocaleString("it-IT")}
                    </td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={pkg.status} />
                    </td>
                    <td className="py-2 pr-4">{pkg.location ?? "-"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(pkg.updated_at).toLocaleString("it-IT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface>
          <h2 className="mb-4 text-base font-semibold">Aggiorna pacco</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormField label="Pacco">
              <SelectInput
                value={selectedId}
                onChange={(event) => onSelectPackage(event.target.value)}
              >
                <option value="">- seleziona -</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.code}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Stato">
              <SelectInput
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PackageStatus)
                }
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Posizione">
              <TextInput
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Es. Area spedizioni"
              />
            </FormField>
            {selectedPackage && (
              <div className="rounded-md border border-border bg-background p-3 text-sm">
                <div className="font-mono font-semibold">
                  {selectedPackage.code}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {selectedPackage.quantity.toLocaleString("it-IT")} pezzi da{" "}
                  {selectedPackage.line?.name ?? selectedPackage.line_id}
                </div>
              </div>
            )}
            <PrimaryButton
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Salvataggio..." : "Registra movimento"}
            </PrimaryButton>
          </form>
        </Surface>
      </div>

      <Surface>
        <h2 className="mb-4 text-base font-semibold">Ultime operazioni</h2>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data?.auditLog ?? []).slice(0, 9).map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-border bg-background p-3"
            >
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                {entry.action}
              </div>
              <div className="mt-1 font-mono text-sm">
                {entry.entity_id ?? "-"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString("it-IT")}
              </div>
            </div>
          ))}
          {!data?.auditLog?.length && (
            <div className="text-sm text-muted-foreground">
              Nessuna operazione registrata.
            </div>
          )}
        </div>
      </Surface>
    </PageShell>
  );
}

function StatusBadge({ status }: { status: PackageStatus }) {
  const label =
    statusOptions.find((option) => option.value === status)?.label ?? status;
  const className =
    status === "anomalia"
      ? "bg-destructive/10 text-destructive"
      : status === "spedito"
        ? "bg-sky-100 text-sky-800"
        : status === "in_lavorazione"
          ? "bg-amber-100 text-amber-800"
          : "bg-emerald-100 text-emerald-800";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
