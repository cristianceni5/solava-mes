import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  FormField,
  PageHeader,
  PageShell,
  PrimaryButton,
  SelectInput,
  Surface,
  TextInput,
  fieldControlClassName,
} from "@/components/mes-ui";
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
          department_id: employee!.phase_id,
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
      toast.error(
        "Problema: il MES non riesce a salvare il versamento. Codice errore: MES-RETE-VERSAMENTO.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Versamento produzione"
        description="Registra i pezzi prodotti su una linea"
      />

      <Surface className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Prodotto">
              <SelectInput
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">- Seleziona -</option>
                {data?.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Macchinario">
              <SelectInput
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
              >
                <option value="">- Seleziona -</option>
                {data?.machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.line} · {machine.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Quantità prodotta">
              <TextInput
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Scarti">
              <TextInput
                type="number"
                min={0}
                value={scrap}
                onChange={(e) => setScrap(e.target.value)}
              />
            </FormField>

            <FormField label="Turno">
              <SelectInput
                value={shift}
                onChange={(e) =>
                  setShift(e.target.value as "mattina" | "pomeriggio" | "notte")
                }
              >
                <option value="mattina">Mattina</option>
                <option value="pomeriggio">Pomeriggio</option>
                <option value="notte">Notte</option>
              </SelectInput>
            </FormField>

            <FormField label="Operatore">
              <TextInput
                disabled
                value={`${employee?.full_name} (${employee?.matricola})`}
                className="text-muted-foreground"
              />
            </FormField>
          </div>

          <FormField label="Note (facoltative)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className={fieldControlClassName}
              placeholder="Anomalie, fermo macchina, ecc."
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Salvataggio..." : "Registra versamento"}
            </PrimaryButton>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
