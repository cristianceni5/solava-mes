import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getDepartments,
  getLoginOptions,
  getInventoryOverview,
  getPlcPrintQueue,
  getSystemDiagnostics,
  getWorkstation,
  loginOperator,
  submitPhaseReceipt,
  updateInventoryPackage,
} from "@/lib/mes-v1.server";
import {
  describeDatabaseError,
  supabaseAdmin,
  unwrap,
} from "@/lib/supabase.server";
import { operatorPinHash } from "@/lib/operator-pin";

type Employee = {
  id: string;
  matricola: string;
  full_name: string;
  role: EmployeeRole;
  active: boolean;
  created_at: string;
};

type EmployeeRole = "operatore" | "magazziniere" | "caporeparto" | "admin";

type Product = {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
};

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

type Machine = {
  id: string;
  code: string;
  name: string;
  line: string;
  plc: string;
  network: string;
};

type ProductionEntry = {
  id: string;
  employee_id: string;
  department_id: string | null;
  product_id: string;
  machine_id: string;
  quantity: number;
  scrap: number;
  shift: "mattina" | "pomeriggio" | "notte";
  notes: string | null;
  created_at: string;
};

type Shipment = {
  id: string;
  bolla_number: string;
  carro_number: string;
  product_id: string;
  quantity: number;
  destination: string | null;
  notes: string | null;
  employee_id: string;
  label_generated_at: string;
  created_at: string;
};

type Department = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

const loginSchema = z.object({
  matricola: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9]+$/),
  pin: z
    .string()
    .trim()
    .min(4)
    .max(10)
    .regex(/^[0-9]+$/),
  phase_id: z.string().trim().min(1).max(50),
});

const employeeRoleSchema = z.enum([
  "operatore",
  "magazziniere",
  "caporeparto",
  "admin",
]);

const employeeFormSchema = z.object({
  admin_id: z.string().uuid(),
  id: z.string().uuid().optional().nullable(),
  matricola: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9]+$/),
  full_name: z.string().trim().min(1).max(120),
  role: employeeRoleSchema,
  active: z.boolean(),
  pin: z
    .string()
    .trim()
    .regex(/^[0-9]*$/)
    .max(10)
    .optional()
    .nullable(),
});

const employeeActiveSchema = z.object({
  admin_id: z.string().uuid(),
  id: z.string().uuid(),
  active: z.boolean(),
});

const departmentSchema = z.object({
  admin_id: z.string().uuid(),
  id: z
    .string()
    .trim()
    .min(2)
    .max(49)
    .regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().trim().min(1).max(80),
  sort_order: z.number().int().min(0).max(10_000),
  active: z.boolean(),
});

const departmentActiveSchema = z.object({
  admin_id: z.string().uuid(),
  id: z.string().trim().min(2).max(49),
  active: z.boolean(),
});

async function ensureAdmin(adminId: string) {
  const admin = unwrap(
    await supabaseAdmin()
      .from("operators")
      .select("id")
      .eq("id", adminId)
      .eq("role", "admin")
      .eq("active", true)
      .maybeSingle(),
  ) as { id: string } | null;

  return Boolean(admin);
}

export const loginEmployee = createServerFn({ method: "POST" })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await loginOperator(data.matricola, data.pin, data.phase_id);
    } catch (error) {
      return { ok: false as const, error: describeDatabaseError(error) };
    }
  });

export const getMesOptions = createServerFn({ method: "GET" }).handler(
  async () => getLoginOptions(),
);

export const getPrintQueue = createServerFn({ method: "GET" }).handler(
  async () => getPlcPrintQueue(),
);

export const getInventory = createServerFn({ method: "GET" }).handler(
  async () => getInventoryOverview(),
);

export const getDiagnostics = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      return await getSystemDiagnostics();
    } catch (error) {
      return getSystemDiagnosticsFallback(describeDatabaseError(error));
    }
  },
);

function getSystemDiagnosticsFallback(message: string) {
  const now = new Date().toISOString();
  return {
    runtime: {
      app: "solava-mes",
      mode: process.env.NODE_ENV ?? "development",
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      now,
    },
    configuration: {
      supabaseConfigured: false,
      supabaseTarget: null,
      publicKeyConfigured: false,
      plcTopology: {
        controller: "S7-1500",
        architecture:
          "PLC unico centrale: gli S7-1200 inviano i dati al S7-1500; i PLC legacy inviano ai S7-1200.",
        protocol: "OPC UA",
        connectionCode: "s7-1500-main",
      },
      plcHttpPort: 8031,
      plcEndpoints: [],
    },
    sql: {
      ok: false,
      configured: false,
      message,
      checkedAt: now,
    },
    supabase: {
      ok: false,
      configured: false,
      message,
      checkedAt: now,
    },
    production: {
      phases: [],
      lines: [],
    },
    counters: {
      operators: 0,
      plcEvents: 0,
      duplicatePlcEvents: 0,
      phaseReceipts: 0,
      printJobs: 0,
      inventoryPackages: 0,
      auditEntries: 0,
    },
    printQueue: {
      pending: [],
      failed: [],
      recent: [],
    },
    inventory: {
      packages: [],
      anomalies: [],
    },
    recent: {
      plcEvents: [],
      receipts: [],
      auditLog: [],
    },
  };
}

const inventoryUpdateSchema = z.object({
  package_id: z.string().uuid(),
  operator_id: z.string().uuid(),
  status: z.enum(["in_stock", "in_lavorazione", "spedito", "anomalia"]),
  location: z.string().trim().max(80).optional().nullable(),
});

export const updateInventory = createServerFn({ method: "POST" })
  .inputValidator((data) => inventoryUpdateSchema.parse(data))
  .handler(async ({ data }) => updateInventoryPackage(data));

const workstationSchema = z.object({
  phase_id: z.string().trim().min(1).max(50),
});

export const getPhaseWorkstation = createServerFn({ method: "POST" })
  .inputValidator((data) => workstationSchema.parse(data))
  .handler(async ({ data }) => getWorkstation(data.phase_id));

const phaseReceiptSchema = z.object({
  employee_id: z.string().uuid(),
  phase_id: z.string().trim().min(1).max(50),
  line_id: z.enum(["mattoni", "tegole"]),
  plc_event_id: z.string().uuid(),
});

export const confirmPhaseReceipt = createServerFn({ method: "POST" })
  .inputValidator((data) => phaseReceiptSchema.parse(data))
  .handler(async ({ data }) => submitPhaseReceipt(data));

export const getCatalogs = createServerFn({ method: "GET" }).handler(
  async () => {
    const [products, machines, departments] = await Promise.all([
      supabaseAdmin().from("products").select("*").order("code"),
      supabaseAdmin().from("machines").select("*").order("code"),
      getDepartments(true),
    ]);
    return {
      products: unwrap(products) as Product[],
      machines: unwrap(machines) as Machine[],
      departments: departments as Department[],
    };
  },
);

export const getRecipes = createServerFn({ method: "GET" }).handler(
  async () => {
    const recipes = unwrap(
      await supabaseAdmin()
        .from("recipes")
        .select("*")
        .order("updated_at", { ascending: false }),
    ) as Recipe[];
    return {
      recipes,
      kpi: {
        total: recipes.length,
        active: recipes.filter((recipe) => recipe.active).length,
        working: recipes.filter((recipe) => recipe.type === "lavorazione")
          .length,
        packaging: recipes.filter((recipe) => recipe.type === "imballo").length,
      },
    };
  },
);

const entrySchema = z.object({
  employee_id: z.string().uuid(),
  department_id: z.string().trim().min(1).max(50),
  product_id: z.string().uuid(),
  machine_id: z.string().uuid(),
  quantity: z.number().int().positive().max(1_000_000),
  scrap: z.number().int().min(0).max(1_000_000),
  shift: z.enum(["mattina", "pomeriggio", "notte"]),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const submitProduction = createServerFn({ method: "POST" })
  .inputValidator((data) => entrySchema.parse(data))
  .handler(async ({ data }) => {
    const employee = unwrap(
      await supabaseAdmin()
        .from("operators")
        .select("id")
        .eq("id", data.employee_id)
        .eq("active", true)
        .maybeSingle(),
    ) as { id: string } | null;
    if (!employee) {
      return { ok: false as const, error: "Dipendente non valido" };
    }
    const department = unwrap(
      await supabaseAdmin()
        .from("departments")
        .select("id")
        .eq("id", data.department_id)
        .eq("active", true)
        .maybeSingle(),
    ) as { id: string } | null;
    if (!department) {
      return { ok: false as const, error: "Reparto non valido" };
    }

    const entry = unwrap(
      await supabaseAdmin()
        .from("production_entries")
        .insert(data)
        .select("id")
        .single(),
    ) as { id: string };

    unwrap(
      await supabaseAdmin()
        .from("department_movements")
        .insert({
          department_id: data.department_id,
          movement_type: "versamento",
          production_entry_id: entry.id,
          product_id: data.product_id,
          operator_id: data.employee_id,
          quantity: data.quantity,
          notes: data.notes,
        })
        .select("id")
        .single(),
    );
    return { ok: true as const };
  });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: { employee_id: string }) =>
    z.object({ employee_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const entries = unwrap(
      await supabaseAdmin()
        .from("production_entries")
        .select("*")
        .order("created_at", { ascending: false }),
    ) as ProductionEntry[];
    const [products, machines, employees] = await Promise.all([
      supabaseAdmin().from("products").select("*"),
      supabaseAdmin().from("machines").select("*"),
      supabaseAdmin()
        .from("operators")
        .select("id, matricola, full_name, role, active, created_at"),
    ]);
    const catalogs = {
      products: unwrap(products) as Product[],
      machines: unwrap(machines) as Machine[],
      employees: unwrap(employees) as Employee[],
    };
    const recent = entries
      .slice(0, 50)
      .map((entry) => rowForEntry(entry, catalogs));
    const totalQty = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const totalScrap = entries.reduce((sum, entry) => sum + entry.scrap, 0);
    const byMachine = catalogs.machines
      .map((machine) => ({
        line: machine.line,
        name: machine.name,
        qty: entries
          .filter((entry) => entry.machine_id === machine.id)
          .reduce((sum, entry) => sum + entry.quantity, 0),
      }))
      .filter((row) => row.qty > 0);

    return {
      kpi: {
        totalQty,
        totalScrap,
        scrapRate:
          totalQty > 0
            ? Math.round((totalScrap / (totalQty + totalScrap)) * 1000) / 10
            : 0,
        entries24h: entries.length,
      },
      byMachine,
      recent,
      myRecent: recent
        .filter((entry) => entry.employee_id === data.employee_id)
        .slice(0, 10)
        .map((entry) => ({
          quantity: entry.quantity,
          scrap: entry.scrap,
          created_at: entry.created_at,
          products: entry.products,
        })),
    };
  });

function rowForEntry(
  entry: ProductionEntry,
  catalogs: { products: Product[]; machines: Machine[]; employees: Employee[] },
) {
  const product = catalogs.products.find(
    (item) => item.id === entry.product_id,
  );
  const machine = catalogs.machines.find(
    (item) => item.id === entry.machine_id,
  );
  const employee = catalogs.employees.find(
    (item) => item.id === entry.employee_id,
  );
  return {
    ...entry,
    products: { name: product?.name, code: product?.code, unit: product?.unit },
    machines: { name: machine?.name, line: machine?.line, plc: machine?.plc },
    employees: {
      full_name: employee?.full_name,
      matricola: employee?.matricola,
    },
  };
}

export const getEmployeesList = createServerFn({ method: "GET" }).handler(
  async () => {
    const employees = unwrap(
      await supabaseAdmin()
        .from("operators")
        .select("id, matricola, full_name, role, active, created_at")
        .order("matricola"),
    ) as Employee[];
    return { employees };
  },
);

export const saveEmployee = createServerFn({ method: "POST" })
  .inputValidator((data) => employeeFormSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await ensureAdmin(data.admin_id))) {
      return { ok: false as const, error: "Permesso negato: serve un admin" };
    }

    const pin = data.pin?.trim() || null;
    if (!data.id && !pin) {
      return {
        ok: false as const,
        error: "PIN obbligatorio per creare un operatore",
      };
    }
    if (pin && pin.length < 4) {
      return { ok: false as const, error: "Il PIN deve avere almeno 4 cifre" };
    }

    try {
      if (data.id) {
        const existing = unwrap(
          await supabaseAdmin()
            .from("operators")
            .select("id, matricola")
            .eq("id", data.id)
            .maybeSingle(),
        ) as { id: string; matricola: string } | null;

        if (!existing) {
          return { ok: false as const, error: "Operatore non trovato" };
        }
        if (existing.matricola !== data.matricola && !pin) {
          return {
            ok: false as const,
            error: "Per cambiare matricola devi impostare anche un nuovo PIN",
          };
        }

        const updatePayload: {
          matricola: string;
          full_name: string;
          role: EmployeeRole;
          active: boolean;
          pin_hash?: string;
        } = {
          matricola: data.matricola,
          full_name: data.full_name,
          role: data.role,
          active: data.active,
        };

        if (pin) {
          updatePayload.pin_hash = await operatorPinHash(data.matricola, pin);
        }

        const employee = unwrap(
          await supabaseAdmin()
            .from("operators")
            .update(updatePayload)
            .eq("id", data.id)
            .select("id, matricola, full_name, role, active, created_at")
            .single(),
        ) as Employee;

        return { ok: true as const, employee };
      }

      const employee = unwrap(
        await supabaseAdmin()
          .from("operators")
          .insert({
            matricola: data.matricola,
            pin_hash: await operatorPinHash(data.matricola, pin),
            full_name: data.full_name,
            role: data.role,
            active: data.active,
          })
          .select("id, matricola, full_name, role, active, created_at")
          .single(),
      ) as Employee;

      return { ok: true as const, employee };
    } catch (error) {
      return { ok: false as const, error: describeDatabaseError(error) };
    }
  });

export const setEmployeeActive = createServerFn({ method: "POST" })
  .inputValidator((data) => employeeActiveSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await ensureAdmin(data.admin_id))) {
      return { ok: false as const, error: "Permesso negato: serve un admin" };
    }
    if (data.admin_id === data.id && !data.active) {
      return {
        ok: false as const,
        error: "Non puoi disattivare il tuo utente admin mentre sei loggato",
      };
    }

    try {
      const employee = unwrap(
        await supabaseAdmin()
          .from("operators")
          .update({ active: data.active })
          .eq("id", data.id)
          .select("id, matricola, full_name, role, active, created_at")
          .single(),
      ) as Employee;

      return { ok: true as const, employee };
    } catch (error) {
      return { ok: false as const, error: describeDatabaseError(error) };
    }
  });

export const getDepartmentsList = createServerFn({ method: "GET" }).handler(
  async () => ({ departments: (await getDepartments(true)) as Department[] }),
);

export const saveDepartment = createServerFn({ method: "POST" })
  .inputValidator((data) => departmentSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await ensureAdmin(data.admin_id))) {
      return { ok: false as const, error: "Permesso negato: serve un admin" };
    }

    try {
      const department = unwrap(
        await supabaseAdmin()
          .from("departments")
          .upsert(
            {
              id: data.id,
              name: data.name,
              sort_order: data.sort_order,
              active: data.active,
            },
            { onConflict: "id" },
          )
          .select("id, name, sort_order, active, created_at, updated_at")
          .single(),
      ) as Department;

      return { ok: true as const, department };
    } catch (error) {
      return { ok: false as const, error: describeDatabaseError(error) };
    }
  });

export const setDepartmentActive = createServerFn({ method: "POST" })
  .inputValidator((data) => departmentActiveSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await ensureAdmin(data.admin_id))) {
      return { ok: false as const, error: "Permesso negato: serve un admin" };
    }

    try {
      const department = unwrap(
        await supabaseAdmin()
          .from("departments")
          .update({ active: data.active })
          .eq("id", data.id)
          .select("id, name, sort_order, active, created_at, updated_at")
          .single(),
      ) as Department;

      return { ok: true as const, department };
    } catch (error) {
      return { ok: false as const, error: describeDatabaseError(error) };
    }
  });

const shipmentSchema = z.object({
  bolla_number: z.string().trim().min(1).max(30),
  carro_number: z.string().trim().min(1).max(30),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(1_000_000),
  destination: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  employee_id: z.string().uuid(),
});

export const createShipment = createServerFn({ method: "POST" })
  .inputValidator((data) => shipmentSchema.parse(data))
  .handler(async ({ data }) => {
    const duplicate = unwrap(
      await supabaseAdmin()
        .from("shipments")
        .select("id")
        .eq("bolla_number", data.bolla_number)
        .eq("carro_number", data.carro_number)
        .maybeSingle(),
    ) as { id: string } | null;
    if (duplicate) {
      return {
        ok: false as const,
        error: "Bolla + carro gia esistente (duplicato)",
      };
    }
    unwrap(
      await supabaseAdmin()
        .from("shipments")
        .insert(data)
        .select("id")
        .single(),
    );
    return { ok: true as const };
  });

export const getShipments = createServerFn({ method: "GET" }).handler(
  async () => {
    const [shipmentResult, productsResult, employeesResult] = await Promise.all(
      [
        supabaseAdmin()
          .from("shipments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseAdmin().from("products").select("*"),
        supabaseAdmin()
          .from("operators")
          .select("id, matricola, full_name, role, active, created_at"),
      ],
    );
    const shipmentRows = unwrap(shipmentResult) as Shipment[];
    const products = unwrap(productsResult) as Product[];
    const employees = unwrap(employeesResult) as Employee[];
    const shipments = shipmentRows.map((shipment) => {
      const product = products.find((item) => item.id === shipment.product_id);
      const employee = employees.find(
        (item) => item.id === shipment.employee_id,
      );
      return {
        ...shipment,
        products: {
          name: product?.name,
          code: product?.code,
          unit: product?.unit,
        },
        employees: {
          full_name: employee?.full_name,
          matricola: employee?.matricola,
        },
      };
    });
    return {
      shipments,
      kpi: {
        count24h: shipments.length,
        qty24h: shipments.reduce((sum, shipment) => sum + shipment.quantity, 0),
      },
    };
  },
);
