import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Radio, Truck } from "lucide-react";
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
  const { data: catalogs } = useQuery({ queryKey: ["catalogs"], queryFn: () => fetchCatalogs() });

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
    if (!form.bolla_number || !form.carro_number || !form.product_id || !form.quantity) {
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spedizioni</h1>
          <p className="text-sm text-muted-foreground">
            Etichette generate e coda controllata dal database locale
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Radio className="h-3 w-3 text-primary" />
          Sync 30s
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat icon={Truck} label="Etichette" value={String(data?.kpi.count24h ?? 0)} />
        <Stat
          icon={Package}
          label="Pezzi"
          value={(data?.kpi.qty24h ?? 0).toLocaleString("it-IT")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Plus className="h-4 w-4 text-primary" /> Genera etichetta
          </h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="N. Bolla *"
              value={form.bolla_number}
              onChange={(value) => setForm({ ...form, bolla_number: value })}
            />
            <Input
              label="N. Carro *"
              value={form.carro_number}
              onChange={(value) => setForm({ ...form, carro_number: value })}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Prodotto *</span>
              <select
                value={form.product_id}
                onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">- seleziona -</option>
                {catalogs?.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} · {product.name}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Quantità pezzi *"
              value={form.quantity}
              onChange={(value) => setForm({ ...form, quantity: value })}
              type="number"
            />
            <Input
              label="Destinazione"
              value={form.destination}
              onChange={(value) => setForm({ ...form, destination: value })}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
            >
              {submitting ? "Salvataggio..." : "Genera etichetta"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
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
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Caricamento...
                    </td>
                  </tr>
                )}
                {(data?.shipments ?? []).map((shipment) => (
                  <tr key={shipment.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(shipment.label_generated_at).toLocaleString("it-IT")}
                    </td>
                    <td className="py-2 pr-4 font-mono font-semibold">{shipment.bolla_number}</td>
                    <td className="py-2 pr-4 font-mono">{shipment.carro_number}</td>
                    <td className="py-2 pr-4">{shipment.products?.name ?? "-"}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{shipment.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
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
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
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
