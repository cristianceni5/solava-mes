import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock3,
  Factory,
  FileText,
  Hash,
  Package,
  PackagePlus,
  PackageX,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getCatalogs, submitProduction } from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/versamento")({
  component: Versamento,
});

function Versamento() {
  const { employee } = useAuth();
  const fetchCat = useServerFn(getCatalogs);
  const submit = useServerFn(submitProduction);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCat(),
  });

  const [productId, setProductId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [shift, setShift] = useState<"mattina" | "pomeriggio" | "notte">(
    "mattina",
  );
  const [quantity, setQuantity] = useState("");
  const [scrap, setScrap] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !machineId || !quantity) {
      toast.error("Compila prodotto, macchinario e quantità");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          employee_id: employee!.id,
          product_id: productId,
          machine_id: machineId,
          quantity: parseInt(quantity, 10),
          scrap: parseInt(scrap || "0", 10),
          shift,
          notes: notes || null,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Versamento registrato");
      setQuantity("");
      setScrap("0");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["history"] });
    } catch (err) {
      console.error(err);
      toast.error("Errore di rete");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <PackagePlus className="h-6 w-6 text-primary" />
            Versamento produzione
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra i pezzi prodotti su una linea
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prodotto" icon={Package}>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={inputCls}
            >
              <option value="">- Seleziona -</option>
              {data?.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} - {product.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Macchinario" icon={Factory}>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className={inputCls}
            >
              <option value="">- Seleziona -</option>
              {data?.machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.line} · {machine.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantità prodotta" icon={Hash}>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputCls}
              placeholder="0"
            />
          </Field>

          <Field label="Scarti" icon={PackageX}>
            <input
              type="number"
              min={0}
              value={scrap}
              onChange={(e) => setScrap(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Turno" icon={Clock3}>
            <select
              value={shift}
              onChange={(e) =>
                setShift(e.target.value as "mattina" | "pomeriggio" | "notte")
              }
              className={inputCls}
            >
              <option value="mattina">Mattina</option>
              <option value="pomeriggio">Pomeriggio</option>
              <option value="notte">Notte</option>
            </select>
          </Field>

          <Field label="Operatore" icon={UserRound}>
            <input
              disabled
              value={`${employee?.full_name} (${employee?.matricola})`}
              className={`${inputCls} text-muted-foreground`}
            />
          </Field>
        </div>

        <Field label="Note (facoltative)" icon={FileText}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            className={inputCls}
            placeholder="Anomalie, fermo macchina, ecc."
          />
        </Field>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {busy ? "Salvataggio..." : "Registra versamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      {children}
    </label>
  );
}
