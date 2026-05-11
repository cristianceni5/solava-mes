import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Printer,
  Radio,
  Truck,
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
  TableSurface,
  TextInput,
} from "@/components/mes-ui";
import {
  createShipment,
  getCatalogs,
  getPrintQueue,
  getShipments,
} from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/spedizioni")({
  component: SpedizioniStampePage,
});

function SpedizioniStampePage() {
  const { employee } = useAuth();
  const qc = useQueryClient();
  const fetchShipments = useServerFn(getShipments);
  const fetchCatalogs = useServerFn(getCatalogs);
  const fetchPrintQueue = useServerFn(getPrintQueue);
  const submitShipment = useServerFn(createShipment);

  const { data: shipmentsData, isLoading: loadingShipments } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetchShipments(),
    refetchInterval: 30_000,
  });
  const { data: queueData, isLoading: loadingQueue } = useQuery({
    queryKey: ["print-queue"],
    queryFn: () => fetchPrintQueue(),
    refetchInterval: 5_000,
  });
  const { data: catalogs } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCatalogs(),
  });

  const [form, setForm] = useState({
    bolla_number: "",
    carro_number: "",
    product_id: "",
    quantity: "",
    destination: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;
    if (
      !form.bolla_number ||
      !form.carro_number ||
      !form.product_id ||
      !form.quantity
    ) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setSubmitting(true);
    const res = await submitShipment({
      data: {
        bolla_number: form.bolla_number.trim(),
        carro_number: form.carro_number.trim(),
        product_id: form.product_id,
        quantity: Number(form.quantity),
        destination: form.destination || null,
        notes: form.notes || null,
        employee_id: employee.id,
      },
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Etichetta generata");
    setForm({
      bolla_number: "",
      carro_number: "",
      product_id: "",
      quantity: "",
      destination: "",
      notes: "",
    });
    qc.invalidateQueries({ queryKey: ["shipments"] });
  }

  const failedPrints = queueData?.kpi.failed ?? 0;

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Spedizioni e stampe"
        description="Etichette di uscita, bolle e coda stampa PLC in un'unica vista"
        action={
          <StatusPill icon={Radio}>Stampe 5s · spedizioni 30s</StatusPill>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          icon={Truck}
          label="Etichette uscita"
          value={String(shipmentsData?.kpi.count24h ?? 0)}
        />
        <StatCard
          icon={Package}
          label="Pezzi uscita"
          value={(shipmentsData?.kpi.qty24h ?? 0).toLocaleString("it-IT")}
        />
        <StatCard
          icon={Clock}
          label="Stampe in coda"
          value={String(queueData?.kpi.pending ?? 0)}
          tone={(queueData?.kpi.pending ?? 0) > 20 ? "warning" : "neutral"}
        />
        <StatCard
          icon={Printer}
          label="In stampa"
          value={String(queueData?.kpi.printing ?? 0)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Stampate"
          value={String(queueData?.kpi.printed ?? 0)}
          tone="ok"
        />
        <StatCard
          icon={AlertTriangle}
          label="Errori stampa"
          value={String(failedPrints)}
          tone={failedPrints > 0 ? "error" : "neutral"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <Surface>
          <h2 className="mb-4 text-base font-semibold">
            Genera etichetta uscita
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <ShipmentInput
              label="N. bolla *"
              value={form.bolla_number}
              onChange={(value) => setForm({ ...form, bolla_number: value })}
            />
            <ShipmentInput
              label="N. carro *"
              value={form.carro_number}
              onChange={(value) => setForm({ ...form, carro_number: value })}
            />
            <FormField label="Prodotto *">
              <SelectInput
                value={form.product_id}
                onChange={(event) =>
                  setForm({ ...form, product_id: event.target.value })
                }
              >
                <option value="">Seleziona prodotto</option>
                {catalogs?.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} · {product.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <ShipmentInput
              label="Quantità pezzi *"
              value={form.quantity}
              onChange={(value) => setForm({ ...form, quantity: value })}
              type="number"
            />
            <ShipmentInput
              label="Destinazione"
              value={form.destination}
              onChange={(value) => setForm({ ...form, destination: value })}
            />
            <PrimaryButton
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2"
            >
              {submitting ? "Salvataggio..." : "Genera etichetta"}
            </PrimaryButton>
          </form>
        </Surface>

        <Surface>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">
              Etichette uscita generate
            </h2>
            <StatusPill>
              {formatCount(
                shipmentsData?.shipments.length ?? 0,
                "record",
                "record",
              )}
            </StatusPill>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Bolla</th>
                  <th className="py-2 pr-4">Carro</th>
                  <th className="py-2 pr-4">Prodotto</th>
                  <th className="py-2 pr-4 text-right">Pezzi</th>
                  <th className="py-2 pr-4">Destinazione</th>
                </tr>
              </thead>
              <tbody>
                {loadingShipments && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Caricamento...
                    </td>
                  </tr>
                )}
                {(shipmentsData?.shipments ?? []).map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDate(shipment.label_generated_at)}
                    </td>
                    <td className="py-2 pr-4 font-mono font-semibold">
                      {shipment.bolla_number}
                    </td>
                    <td className="py-2 pr-4 font-mono">
                      {shipment.carro_number}
                    </td>
                    <td className="py-2 pr-4">
                      {shipment.products?.name ?? "-"}
                    </td>
                    <td className="py-2 pr-4 text-right font-semibold">
                      {shipment.quantity.toLocaleString("it-IT")}
                    </td>
                    <td className="py-2 pr-4">{shipment.destination ?? "-"}</td>
                  </tr>
                ))}
                {!loadingShipments && !shipmentsData?.shipments.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Nessuna etichetta uscita generata.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>

      <TableSurface>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Linea</th>
              <th className="px-4 py-3">Etichetta PLC</th>
              <th className="px-4 py-3 text-right">Quantità</th>
              <th className="px-4 py-3">Stampante</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Errore</th>
            </tr>
          </thead>
          <tbody>
            {loadingQueue && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Caricamento...
                </td>
              </tr>
            )}
            {(queueData?.jobs ?? []).map((job) => (
              <tr key={job.id} className="border-t border-border">
                <td className="px-4 py-2 text-muted-foreground">
                  {formatDate(job.created_at)}
                </td>
                <td className="px-4 py-2 font-semibold">
                  {job.line?.name ?? job.line_id}
                </td>
                <td className="px-4 py-2 font-mono">{job.label}</td>
                <td className="px-4 py-2 text-right font-semibold">
                  {job.quantity.toLocaleString("it-IT")}
                </td>
                <td className="px-4 py-2">{job.printer_name}</td>
                <td className="px-4 py-2">
                  <PrintStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-2 text-destructive">
                  {job.error_message ?? "-"}
                </td>
              </tr>
            ))}
            {!loadingQueue && !queueData?.jobs.length && (
              <tr>
                <td
                  colSpan={7}
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

function ShipmentInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <FormField label={label}>
      <TextInput
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

function PrintStatusBadge({ status }: { status: string }) {
  const className =
    status === "failed"
      ? "bg-destructive/10 text-destructive"
      : status === "printed"
        ? "bg-emerald-100 text-emerald-800"
        : status === "printing"
          ? "bg-sky-100 text-sky-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      {printStatusLabel(status)}
    </span>
  );
}

function printStatusLabel(status: string) {
  if (status === "pending") return "In coda";
  if (status === "printing") return "In stampa";
  if (status === "printed") return "Stampato";
  if (status === "failed") return "Errore";
  return "Stato non riconosciuto";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("it-IT");
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
