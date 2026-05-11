import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { productionPhases } from "@/lib/mes-v1";
import {
  getLoginOptions,
  getInventoryOverview,
  getPlcPrintQueue,
  getSystemDiagnostics,
  getWorkstation,
  loginOperator,
  submitPhaseReceipt,
  updateInventoryPackage,
} from "@/lib/mes-v1.server";

type Employee = {
  id: string;
  matricola: string;
  full_name: string;
  role: "operatore" | "caporeparto" | "admin";
  active: boolean;
  created_at: string;
};

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

type Store = {
  employees: Employee[];
  products: Product[];
  recipes: Recipe[];
  machines: Machine[];
  productionEntries: ProductionEntry[];
  shipments: Shipment[];
};

declare global {
  var solavaLegacyStore: Store | undefined;
}

function now() {
  return new Date().toISOString();
}

function store() {
  globalThis.solavaLegacyStore ??= {
    employees: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        matricola: "1001",
        full_name: "Operatore Verde",
        role: "operatore",
        active: true,
        created_at: now(),
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        matricola: "1002",
        full_name: "Operatore Secco",
        role: "operatore",
        active: true,
        created_at: now(),
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        matricola: "1003",
        full_name: "Operatore Cotto",
        role: "caporeparto",
        active: true,
        created_at: now(),
      },
      {
        id: "99999999-9999-4999-8999-999999999999",
        matricola: "9999",
        full_name: "Responsabile Turno",
        role: "admin",
        active: true,
        created_at: now(),
      },
    ],
    products: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        code: "MT-COTTO",
        name: "Mattone cotto toscano",
        type: "mattone",
        unit: "pz",
      },
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        code: "TG-COPPO",
        name: "Tegola in cotto",
        type: "tegola",
        unit: "pz",
      },
    ],
    recipes: [
      {
        id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
        code: "RIC-MAT-COTTO-001",
        description: "Mattone cotto toscano - ciclo standard",
        type: "lavorazione",
        line: "mattoni",
        version: 1,
        active: true,
        payload: {
          product_code: "MT-COTTO",
          target_quantity: 1280,
          cycle_seconds: 42,
          material_checks: ["argilla", "umidita", "taglio"],
        },
        updated_at: now(),
      },
      {
        id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
        code: "RIC-TEG-COPPO-001",
        description: "Tegola in cotto - ciclo standard",
        type: "lavorazione",
        line: "tegole",
        version: 1,
        active: true,
        payload: {
          product_code: "TG-COPPO",
          target_quantity: 640,
          cycle_seconds: 55,
          material_checks: ["impasto", "pressatura", "essiccazione"],
        },
        updated_at: now(),
      },
      {
        id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
        code: "RIC-IMB-PALLET-001",
        description: "Imballo pallet standard",
        type: "imballo",
        line: "mattoni",
        version: 2,
        active: true,
        payload: {
          product_code: "MT-COTTO",
          target_quantity: 960,
          cycle_seconds: 30,
          material_checks: ["pallet", "film", "reggetta"],
          packaging: "pallet 120x100",
        },
        updated_at: now(),
      },
    ],
    machines: [
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
        code: "LINGL",
        name: "Uscita Lingl",
        line: "LINEA MATTONI",
        plc: "siemens_s7_1500",
        network: "profinet",
      },
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        code: "CAPACCIOLI",
        name: "Uscita Capaccioli",
        line: "LINEA TEGOLE",
        plc: "siemens_s7_1500",
        network: "profinet",
      },
    ],
    productionEntries: [
      {
        id: crypto.randomUUID(),
        employee_id: "11111111-1111-4111-8111-111111111111",
        product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        machine_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
        quantity: 1280,
        scrap: 0,
        shift: "mattina",
        notes: "Dato demo locale",
        created_at: now(),
      },
    ],
    shipments: [],
  };
  return globalThis.solavaLegacyStore;
}

const phaseIds = productionPhases.map((phase) => phase.id) as [
  (typeof productionPhases)[number]["id"],
  ...(typeof productionPhases)[number]["id"][],
];

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
  phase_id: z.enum(phaseIds),
});

export const loginEmployee = createServerFn({ method: "POST" })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) =>
    loginOperator(data.matricola, data.pin, data.phase_id),
  );

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
  async () => getSystemDiagnostics(),
);

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
  phase_id: z.enum(phaseIds),
});

export const getPhaseWorkstation = createServerFn({ method: "POST" })
  .inputValidator((data) => workstationSchema.parse(data))
  .handler(async ({ data }) => getWorkstation(data.phase_id));

const phaseReceiptSchema = z.object({
  employee_id: z.string().uuid(),
  phase_id: z.enum(phaseIds),
  line_id: z.enum(["mattoni", "tegole"]),
  plc_event_id: z.string().uuid(),
});

export const confirmPhaseReceipt = createServerFn({ method: "POST" })
  .inputValidator((data) => phaseReceiptSchema.parse(data))
  .handler(async ({ data }) => submitPhaseReceipt(data));

export const getCatalogs = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = store();
    return { products: db.products, machines: db.machines };
  },
);

export const getRecipes = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = store();
    return {
      recipes: db.recipes,
      kpi: {
        total: db.recipes.length,
        active: db.recipes.filter((recipe) => recipe.active).length,
        working: db.recipes.filter((recipe) => recipe.type === "lavorazione")
          .length,
        packaging: db.recipes.filter((recipe) => recipe.type === "imballo")
          .length,
      },
    };
  },
);

const entrySchema = z.object({
  employee_id: z.string().uuid(),
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
    const db = store();
    if (
      !db.employees.some(
        (employee) => employee.id === data.employee_id && employee.active,
      )
    ) {
      return { ok: false as const, error: "Dipendente non valido" };
    }
    db.productionEntries.unshift({
      ...data,
      id: crypto.randomUUID(),
      created_at: now(),
    });
    return { ok: true as const };
  });

export const getDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: { employee_id: string }) =>
    z.object({ employee_id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = store();
    const recent = db.productionEntries
      .slice(0, 50)
      .map((entry) => rowForEntry(entry));
    const totalQty = db.productionEntries.reduce(
      (sum, entry) => sum + entry.quantity,
      0,
    );
    const totalScrap = db.productionEntries.reduce(
      (sum, entry) => sum + entry.scrap,
      0,
    );
    const byMachine = db.machines
      .map((machine) => ({
        line: machine.line,
        name: machine.name,
        qty: db.productionEntries
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
        entries24h: db.productionEntries.length,
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

function rowForEntry(entry: ProductionEntry) {
  const db = store();
  const product = db.products.find((item) => item.id === entry.product_id);
  const machine = db.machines.find((item) => item.id === entry.machine_id);
  const employee = db.employees.find((item) => item.id === entry.employee_id);
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
    return { employees: store().employees };
  },
);

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
    const db = store();
    if (
      db.shipments.some(
        (item) =>
          item.bolla_number === data.bolla_number &&
          item.carro_number === data.carro_number,
      )
    ) {
      return {
        ok: false as const,
        error: "Bolla + carro già esistente (duplicato)",
      };
    }
    db.shipments.unshift({
      ...data,
      id: crypto.randomUUID(),
      created_at: now(),
      label_generated_at: now(),
    });
    return { ok: true as const };
  });

export const getShipments = createServerFn({ method: "GET" }).handler(
  async () => {
    const db = store();
    const shipments = db.shipments.map((shipment) => {
      const product = db.products.find(
        (item) => item.id === shipment.product_id,
      );
      const employee = db.employees.find(
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
