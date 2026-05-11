import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, PageShell, TableSurface } from "@/components/mes-ui";
import { getCatalogs, getEmployeesList } from "@/lib/mes.functions";

export const Route = createFileRoute("/_app/anagrafica")({
  component: Anagrafica,
});

function Anagrafica() {
  const fetchCat = useServerFn(getCatalogs);
  const fetchEmp = useServerFn(getEmployeesList);
  const { data: cat } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCat(),
  });
  const { data: emp } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetchEmp(),
  });

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="Anagrafiche"
        description="Dipendenti, prodotti e macchinari registrati nel MES"
      />

      <Section title="Dipendenti">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Matricola</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {emp?.employees.map((employee) => (
              <tr key={employee.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono">{employee.matricola}</td>
                <td className="px-4 py-2">{employee.full_name}</td>
                <td className="px-4 py-2 capitalize">{employee.role}</td>
                <td className="px-4 py-2">
                  {employee.active ? "Attivo" : "Disattivato"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Prodotti">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Unità</th>
            </tr>
          </thead>
          <tbody>
            {cat?.products.map((product) => (
              <tr key={product.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono">{product.code}</td>
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2 capitalize">{product.type}</td>
                <td className="px-4 py-2">{product.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Macchinari & PLC">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Macchina</th>
              <th className="px-4 py-3">Linea</th>
              <th className="px-4 py-3">PLC</th>
              <th className="px-4 py-3">Rete</th>
            </tr>
          </thead>
          <tbody>
            {cat?.machines.map((machine) => (
              <tr key={machine.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono">{machine.code}</td>
                <td className="px-4 py-2">{machine.name}</td>
                <td className="px-4 py-2">{machine.line}</td>
                <td className="px-4 py-2">{machine.plc}</td>
                <td className="px-4 py-2 uppercase">{machine.network}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </PageShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <TableSurface>{children}</TableSurface>
    </section>
  );
}
