import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, Save, X } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  FormField,
  PageHeader,
  PageShell,
  PrimaryButton,
  SelectInput,
  TableSurface,
  TextInput,
} from "@/components/mes-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCatalogs,
  getDepartmentsList,
  getEmployeesList,
  getRecipes,
  saveDepartment,
  saveEmployee,
  setDepartmentActive,
  setEmployeeActive,
} from "@/lib/mes.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/anagrafica")({
  component: Anagrafica,
});

type EmployeeRole = "operatore" | "magazziniere" | "caporeparto" | "admin";

type EmployeeRow = {
  id: string;
  matricola: string;
  full_name: string;
  role: EmployeeRole;
  active: boolean;
  created_at: string;
};

type EmployeeFormState = {
  id: string | null;
  matricola: string;
  full_name: string;
  role: EmployeeRole;
  active: boolean;
  pin: string;
};

type DepartmentRow = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

type DepartmentFormState = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

type ProductRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
};

type RecipeRow = {
  id: string;
  code: string;
  payload: {
    product_code: string;
  };
};

const emptyEmployeeForm: EmployeeFormState = {
  id: null,
  matricola: "",
  full_name: "",
  role: "operatore",
  active: true,
  pin: "",
};

const emptyDepartmentForm: DepartmentFormState = {
  id: "",
  name: "",
  sort_order: 90,
  active: true,
};

type AnagraficaTab = "employees" | "departments" | "products" | "machines";

const roleOptions: { value: EmployeeRole; label: string }[] = [
  { value: "operatore", label: "Operatore" },
  { value: "magazziniere", label: "Magazziniere" },
  { value: "caporeparto", label: "Caporeparto" },
  { value: "admin", label: "Admin" },
];

function Anagrafica() {
  const { employee } = useAuth();
  const qc = useQueryClient();
  const fetchCat = useServerFn(getCatalogs);
  const fetchEmp = useServerFn(getEmployeesList);
  const fetchDepartments = useServerFn(getDepartmentsList);
  const fetchRecipes = useServerFn(getRecipes);
  const submitEmployee = useServerFn(saveEmployee);
  const submitDepartment = useServerFn(saveDepartment);
  const toggleEmployee = useServerFn(setEmployeeActive);
  const toggleDepartment = useServerFn(setDepartmentActive);
  const [form, setForm] = useState<EmployeeFormState>(emptyEmployeeForm);
  const [departmentForm, setDepartmentForm] =
    useState<DepartmentFormState>(emptyDepartmentForm);
  const [activeTab, setActiveTab] = useState<AnagraficaTab>("employees");
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingDepartment, setSubmittingDepartment] = useState(false);
  const isAdmin = employee?.role === "admin";

  const { data: cat } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCat(),
  });
  const { data: emp } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetchEmp(),
  });
  const { data: departmentData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });
  const { data: recipeData } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => fetchRecipes(),
  });

  const employees = (emp?.employees ?? []) as EmployeeRow[];
  const departments = (departmentData?.departments ??
    cat?.departments ??
    []) as DepartmentRow[];
  const products = (cat?.products ?? []) as ProductRow[];
  const recipes = (recipeData?.recipes ?? []) as RecipeRow[];
  const productRecipes = useMemo(() => {
    const byProduct = new Map<string, RecipeRow[]>();
    for (const recipe of recipes) {
      const code = recipe.payload.product_code;
      byProduct.set(code, [...(byProduct.get(code) ?? []), recipe]);
    }
    return byProduct;
  }, [recipes]);
  const recipeOnlyProductCodes = useMemo(() => {
    const productCodes = new Set(products.map((product) => product.code));
    return [...productRecipes.keys()].filter((code) => !productCodes.has(code));
  }, [productRecipes, products]);

  function resetForm() {
    setForm(emptyEmployeeForm);
  }

  function resetDepartmentForm() {
    setDepartmentForm(emptyDepartmentForm);
  }

  function newEmployee() {
    resetForm();
    setEmployeeDialogOpen(true);
  }

  function editEmployee(row: EmployeeRow) {
    setForm({
      id: row.id,
      matricola: row.matricola,
      full_name: row.full_name,
      role: row.role,
      active: row.active,
      pin: "",
    });
    setEmployeeDialogOpen(true);
  }

  function newDepartment() {
    resetDepartmentForm();
    setDepartmentDialogOpen(true);
  }

  function editDepartment(row: DepartmentRow) {
    setDepartmentForm({
      id: row.id,
      name: row.name,
      sort_order: row.sort_order,
      active: row.active,
    });
    setDepartmentDialogOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!employee || !isAdmin) {
      toast.error("Serve un utente admin");
      return;
    }

    setSubmitting(true);
    const res = await submitEmployee({
      data: {
        admin_id: employee.id,
        id: form.id,
        matricola: form.matricola,
        full_name: form.full_name,
        role: form.role,
        active: form.active,
        pin: form.pin || null,
      },
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success(form.id ? "Operatore aggiornato" : "Operatore creato");
    resetForm();
    setEmployeeDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["employees"] });
  }

  async function onToggle(row: EmployeeRow) {
    if (!employee || !isAdmin) {
      toast.error("Serve un utente admin");
      return;
    }

    const res = await toggleEmployee({
      data: {
        admin_id: employee.id,
        id: row.id,
        active: !row.active,
      },
    });

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success(row.active ? "Operatore disattivato" : "Operatore attivato");
    qc.invalidateQueries({ queryKey: ["employees"] });
    if (form.id === row.id) {
      resetForm();
      setEmployeeDialogOpen(false);
    }
  }

  async function onDepartmentToggle(row: DepartmentRow) {
    if (!employee || !isAdmin) {
      toast.error("Serve un utente admin");
      return;
    }

    const res = await toggleDepartment({
      data: {
        admin_id: employee.id,
        id: row.id,
        active: !row.active,
      },
    });

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success(row.active ? "Reparto disattivato" : "Reparto attivato");
    qc.invalidateQueries({ queryKey: ["departments"] });
    qc.invalidateQueries({ queryKey: ["catalogs"] });
    qc.invalidateQueries({ queryKey: ["mes-options"] });
    if (departmentForm.id === row.id) {
      resetDepartmentForm();
      setDepartmentDialogOpen(false);
    }
  }

  async function onDepartmentSubmit(event: FormEvent) {
    event.preventDefault();
    if (!employee || !isAdmin) {
      toast.error("Serve un utente admin");
      return;
    }

    setSubmittingDepartment(true);
    const res = await submitDepartment({
      data: {
        admin_id: employee.id,
        id: departmentForm.id,
        name: departmentForm.name,
        sort_order: departmentForm.sort_order,
        active: departmentForm.active,
      },
    });
    setSubmittingDepartment(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Reparto salvato");
    resetDepartmentForm();
    setDepartmentDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["departments"] });
    qc.invalidateQueries({ queryKey: ["catalogs"] });
    qc.invalidateQueries({ queryKey: ["mes-options"] });
  }

  return (
    <PageShell className="max-w-none">
      <PageHeader
        title="Anagrafiche"
        description="Dipendenti, prodotti e macchinari registrati nel MES"
      />

      <AnagraficaNav
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "employees" && (
        <Section
          title="Dipendenti"
          action={
            isAdmin ? (
              <PrimaryButton
                type="button"
                onClick={newEmployee}
                className="inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuovo utente
              </PrimaryButton>
            ) : null
          }
        >
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Matricola</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Stato</th>
                {isAdmin && <th className="px-4 py-3 text-right">Azioni</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono">{row.matricola}</td>
                  <td className="px-4 py-2">{row.full_name}</td>
                  <td className="px-4 py-2">
                    {roleOptions.find((role) => role.value === row.role)
                      ?.label ?? row.role}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        row.active
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-muted-foreground"
                      }
                    >
                      {row.active ? "Attivo" : "Disattivato"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          label="Modifica"
                          onClick={() => editEmployee(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={row.active ? "Disattiva" : "Attiva"}
                          onClick={() => onToggle(row)}
                        >
                          <Power className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {activeTab === "departments" && isAdmin && (
        <Section
          title="Reparti"
          action={
            <PrimaryButton
              type="button"
              onClick={newDepartment}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuovo reparto
            </PrimaryButton>
          }
        >
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Codice</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Ordine</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono">{row.id}</td>
                  <td className="px-4 py-2">{row.name}</td>
                  <td className="px-4 py-2 tabular-nums">{row.sort_order}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        row.active
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-muted-foreground"
                      }
                    >
                      {row.active ? "Attivo" : "Disattivato"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <IconButton
                        label="Modifica"
                        onClick={() => editDepartment(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={row.active ? "Disattiva" : "Attiva"}
                        onClick={() => onDepartmentToggle(row)}
                      >
                        <Power className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {activeTab === "products" && (
        <Section title="Prodotti">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Codice</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Unita</th>
                <th className="px-4 py-3">Ricette collegate</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const linkedRecipes = productRecipes.get(product.code) ?? [];

                return (
                  <tr key={product.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono">{product.code}</td>
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2 capitalize">{product.type}</td>
                    <td className="px-4 py-2">{product.unit}</td>
                    <td className="px-4 py-2">
                      {linkedRecipes.length ? (
                        <div>
                          <div className="font-semibold">
                            {linkedRecipes.length} ricette
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {linkedRecipes
                              .map((recipe) => recipe.code)
                              .join(", ")}
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-muted-foreground">
                          Nessuna
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recipeOnlyProductCodes.map((code) => {
                const linkedRecipes = productRecipes.get(code) ?? [];

                return (
                  <tr key={code} className="border-t border-border bg-amber-50">
                    <td className="px-4 py-2 font-mono">{code}</td>
                    <td className="px-4 py-2 font-semibold text-amber-900">
                      Mancante in anagrafica prodotti
                    </td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2">
                      <div className="font-semibold text-amber-900">
                        {linkedRecipes.length} ricette
                      </div>
                      <div className="text-xs text-amber-800">
                        {linkedRecipes.map((recipe) => recipe.code).join(", ")}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      )}

      {activeTab === "machines" && (
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
      )}

      <Dialog
        open={employeeDialogOpen}
        onOpenChange={(open) => {
          setEmployeeDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Modifica operatore" : "Nuovo utente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <FormField label="Matricola">
              <TextInput
                value={form.matricola}
                disabled={!isAdmin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    matricola: event.target.value,
                  }))
                }
                placeholder="1004"
              />
            </FormField>
            <FormField label="Nome completo">
              <TextInput
                value={form.full_name}
                disabled={!isAdmin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    full_name: event.target.value,
                  }))
                }
                placeholder="Nome Cognome"
              />
            </FormField>
            <FormField label="Ruolo">
              <SelectInput
                value={form.role}
                disabled={!isAdmin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as EmployeeRole,
                  }))
                }
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label={form.id ? "Nuovo PIN" : "PIN"}>
              <TextInput
                value={form.pin}
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                disabled={!isAdmin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pin: event.target.value,
                  }))
                }
                placeholder={form.id ? "Lascia vuoto per non cambiarlo" : "1234"}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                disabled={!isAdmin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              Operatore attivo
            </label>
            <div className="flex gap-2 pt-2">
              <PrimaryButton
                type="submit"
                disabled={!isAdmin || submitting}
                className="inline-flex flex-1 items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {submitting ? "Salvataggio..." : "Salva"}
              </PrimaryButton>
              <button
                type="button"
                onClick={() => setEmployeeDialogOpen(false)}
                disabled={!isAdmin}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Annulla</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={departmentDialogOpen}
        onOpenChange={(open) => {
          setDepartmentDialogOpen(open);
          if (!open) resetDepartmentForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {departmentForm.id ? "Modifica reparto" : "Nuovo reparto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onDepartmentSubmit} className="space-y-3">
            <FormField label="Codice reparto">
              <TextInput
                value={departmentForm.id}
                disabled={Boolean(departmentForm.id)}
                onChange={(event) =>
                  setDepartmentForm((current) => ({
                    ...current,
                    id: event.target.value,
                  }))
                }
                placeholder="essiccazione-2"
              />
            </FormField>
            <FormField label="Nome reparto">
              <TextInput
                value={departmentForm.name}
                onChange={(event) =>
                  setDepartmentForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Essiccazione 2"
              />
            </FormField>
            <FormField label="Ordine">
              <TextInput
                type="number"
                min={0}
                value={departmentForm.sort_order}
                onChange={(event) =>
                  setDepartmentForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value),
                  }))
                }
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={departmentForm.active}
                onChange={(event) =>
                  setDepartmentForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              Reparto attivo nel login
            </label>
            <div className="flex gap-2 pt-2">
              <PrimaryButton
                type="submit"
                disabled={submittingDepartment}
                className="inline-flex flex-1 items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {submittingDepartment ? "Salvataggio..." : "Salva"}
              </PrimaryButton>
              <button
                type="button"
                onClick={() => setDepartmentDialogOpen(false)}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-accent"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Annulla</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function AnagraficaNav({
  activeTab,
  onChange,
}: {
  activeTab: AnagraficaTab;
  onChange: (tab: AnagraficaTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <AnagraficaNavButton
        active={activeTab === "employees"}
        label="Dipendenti"
        onClick={() => onChange("employees")}
      />
      <AnagraficaNavButton
        active={activeTab === "departments"}
        label="Reparti"
        onClick={() => onChange("departments")}
      />
      <AnagraficaNavButton
        active={activeTab === "products"}
        label="Prodotti"
        onClick={() => onChange("products")}
      />
      <AnagraficaNavButton
        active={activeTab === "machines"}
        label="Macchinari & PLC"
        onClick={() => onChange("machines")}
      />
    </div>
  );
}

function AnagraficaNavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          : "rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
      }
    >
      {label}
    </button>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <TableSurface>{children}</TableSurface>
    </section>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
