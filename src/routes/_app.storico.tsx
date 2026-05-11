import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  PageHeader,
  PageShell,
  TableSurface,
  TextInput,
} from "@/components/mes-ui";
import { getDashboard } from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/storico")({
  component: Storico,
});

function Storico() {
  const { employee } = useAuth();
  const fetchDash = useServerFn(getDashboard);
  const { data } = useQuery({
    queryKey: ["history", employee?.id],
    queryFn: () => fetchDash({ data: { employee_id: employee!.id } }),
    enabled: !!employee,
  });

  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const list = data?.recent ?? [];
    if (!q) return list;
    const token = q.toLowerCase();
    return list.filter(
      (row) =>
        row.products?.name?.toLowerCase().includes(token) ||
        row.machines?.name?.toLowerCase().includes(token) ||
        row.machines?.line?.toLowerCase().includes(token) ||
        row.employees?.full_name?.toLowerCase().includes(token) ||
        row.employees?.matricola?.toLowerCase().includes(token),
    );
  }, [data, q]);

  return (
    <PageShell>
      <PageHeader
        title="Storico versamenti"
        description="Ultimi 50 versamenti registrati"
        action={
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtra per prodotto, linea, operatore..."
            className="w-72"
          />
        }
      />

      <TableSurface>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Operatore</th>
              <th className="px-4 py-3">Prodotto</th>
              <th className="px-4 py-3">Macchinario</th>
              <th className="px-4 py-3 text-right">Qtà</th>
              <th className="px-4 py-3 text-right">Scarti</th>
              <th className="px-4 py-3">Turno</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(row.created_at).toLocaleString("it-IT")}
                </td>
                <td className="px-4 py-2">
                  {row.employees?.full_name}{" "}
                  <span className="text-muted-foreground">
                    ({row.employees?.matricola})
                  </span>
                </td>
                <td className="px-4 py-2">{row.products?.name}</td>
                <td className="px-4 py-2">
                  {row.machines?.name}{" "}
                  <span className="text-muted-foreground">
                    · {row.machines?.line}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  {row.quantity}
                </td>
                <td className="px-4 py-2 text-right text-destructive">
                  {row.scrap}
                </td>
                <td className="px-4 py-2 capitalize">{row.shift}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nessun versamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableSurface>
    </PageShell>
  );
}
