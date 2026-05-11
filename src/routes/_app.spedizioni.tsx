import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Radio, Truck } from "lucide-react";
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
import { createShipment, getCatalogs, getShipments } from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/spedizioni")({
  component: SpedizioniPage,
});

function SpedizioniPage() {
  const { employee } = useAuth();
  const qc = useQueryClient();
  const fetchShipments = useServerFn(getShipments);
  const fetchCatalogs = useServerFn(getCatalogs);
  const submitShipment = useServerFn(createShipment);

  const { data, isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetchShipments(),
    refetchInterval: 30_000,
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

  return (
    <PageShell>
      <PageHeader
        title="Spedizioni"
        description="Etichette generate e coda controllata dal database locale"
        action={<StatusPill icon={Radio}>Sync 30s</StatusPill>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Truck}
          label="Etichette"
          value={String(data?.kpi.count24h ?? 0)}
        />
        <StatCard
          icon={Package}
          label="Pezzi"
          value={(data?.kpi.qty24h ?? 0).toLocaleString("it-IT")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Surface>
          <h2 className="mb-4 text-base font-semibold">Genera etichetta</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <ShipmentInput
              label="N. Bolla *"
              value={form.bolla_number}
              onChange={(value) => setForm({ ...form, bolla_number: value })}
            />
            <ShipmentInput
              label="N. Carro *"
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
                <option value="">- seleziona -</option>
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

        <Surface className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Etichette uscite</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Bolla</th>
                  <th className="py-2 pr-4">Carro</th>
                  <th className="py-2 pr-4">Prodotto</th>
                  <th className="py-2 pr-4 text-right">Pezzi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Caricamento...
                    </td>
                  </tr>
                )}
                {(data?.shipments ?? []).map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(shipment.label_generated_at).toLocaleString(
                        "it-IT",
                      )}
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
                      {shipment.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
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
