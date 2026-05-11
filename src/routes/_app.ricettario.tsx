import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Boxes,
  FlaskConical,
  PackageCheck,
  Radio,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  FormField,
  PageHeader,
  PageShell,
  SelectInput,
  StatCard,
  StatusPill,
  Surface,
  TableSurface,
  TextInput,
} from "@/components/mes-ui";
import { getRecipes } from "@/lib/mes.functions";

export const Route = createFileRoute("/_app/ricettario")({
  component: RicettarioPage,
});

type Recipe = {
  id: string;
  code: string;
  description: string;
  type: "imballo" | "lavorazione";
  line: "mattoni" | "tegole";
  version: number;
  active: boolean;
  payload: {
    product_code: string;
    target_quantity: number;
    cycle_seconds: number;
    material_checks: string[];
    packaging?: string;
  };
  updated_at: string;
};

function RicettarioPage() {
  const fetchRecipes = useServerFn(getRecipes);
  const { data, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => fetchRecipes(),
    refetchInterval: 30_000,
  });
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const recipes = (data?.recipes ?? []) as Recipe[];
    const needle = search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesSearch =
        !needle ||
        recipe.code.toLowerCase().includes(needle) ||
        recipe.description.toLowerCase().includes(needle) ||
        recipe.payload.product_code.toLowerCase().includes(needle);
      const matchesLine = line === "all" || recipe.line === line;
      const matchesType = type === "all" || recipe.type === type;
      return matchesSearch && matchesLine && matchesType;
    });
  }, [data?.recipes, line, search, type]);

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Ricettario"
        description="Archivio ricette di lavorazione e imballo, pronto per aggancio al database SQL"
        action={<StatusPill icon={Radio}>Sync 30s</StatusPill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Ricette"
          value={String(data?.kpi.total ?? 0)}
        />
        <StatCard
          icon={PackageCheck}
          label="Attive"
          value={String(data?.kpi.active ?? 0)}
        />
        <StatCard
          icon={FlaskConical}
          label="Lavorazione"
          value={String(data?.kpi.working ?? 0)}
        />
        <StatCard
          icon={Boxes}
          label="Imballo"
          value={String(data?.kpi.packaging ?? 0)}
        />
      </div>

      <Surface>
        <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
          <FormField label="Cerca">
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Codice, descrizione, prodotto"
            />
          </FormField>
          <FormField label="Linea">
            <SelectInput
              value={line}
              onChange={(event) => setLine(event.target.value)}
            >
              <option value="all">Tutte</option>
              <option value="mattoni">Mattoni</option>
              <option value="tegole">Tegole</option>
            </SelectInput>
          </FormField>
          <FormField label="Tipo">
            <SelectInput
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="all">Tutti</option>
              <option value="lavorazione">Lavorazione</option>
              <option value="imballo">Imballo</option>
            </SelectInput>
          </FormField>
        </div>
      </Surface>

      <TableSurface>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Descrizione</th>
              <th className="px-4 py-3">Linea</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Q.tà target</th>
              <th className="px-4 py-3">Dettagli</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Caricamento...
                </td>
              </tr>
            )}
            {filtered.map((recipe) => (
              <tr key={recipe.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <div className="font-mono font-semibold">{recipe.code}</div>
                  <div className="text-xs text-muted-foreground">
                    v{recipe.version}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{recipe.description}</div>
                  <div className="text-xs text-muted-foreground">
                    Prodotto {recipe.payload.product_code}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{recipe.line}</td>
                <td className="px-4 py-3">
                  <RecipeBadge value={recipe.type} />
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {recipe.payload.target_quantity.toLocaleString("it-IT")}
                </td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                      Parametri
                    </summary>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">
                      {JSON.stringify(recipe.payload, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {!isLoading && !filtered.length && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nessuna ricetta trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableSurface>
    </PageShell>
  );
}

function RecipeBadge({ value }: { value: Recipe["type"] }) {
  const className =
    value === "imballo"
      ? "bg-sky-100 text-sky-800"
      : "bg-emerald-100 text-emerald-800";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      {value === "imballo" ? "Imballo" : "Lavorazione"}
    </span>
  );
}
