import { T as TSS_SERVER_FUNCTION, c as createServerFn } from "./server-DsZKktrW.js";
import { z } from "zod";
import { p as productionPhases, l as loginOperator, g as getLoginOptions, a as getPlcPrintQueue, b as getWorkstation, s as submitPhaseReceipt } from "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function store() {
  globalThis.solavaLegacyStore ??= {
    employees: [{
      id: "11111111-1111-4111-8111-111111111111",
      matricola: "1001",
      full_name: "Operatore Verde",
      role: "operatore",
      active: true,
      created_at: now()
    }, {
      id: "22222222-2222-4222-8222-222222222222",
      matricola: "1002",
      full_name: "Operatore Secco",
      role: "operatore",
      active: true,
      created_at: now()
    }, {
      id: "33333333-3333-4333-8333-333333333333",
      matricola: "1003",
      full_name: "Operatore Cotto",
      role: "caporeparto",
      active: true,
      created_at: now()
    }, {
      id: "99999999-9999-4999-8999-999999999999",
      matricola: "9999",
      full_name: "Responsabile Turno",
      role: "admin",
      active: true,
      created_at: now()
    }],
    products: [{
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      code: "MT-COTTO",
      name: "Mattone cotto toscano",
      type: "mattone",
      unit: "pz"
    }, {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
      code: "TG-COPPO",
      name: "Tegola in cotto",
      type: "tegola",
      unit: "pz"
    }],
    machines: [{
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      code: "LINGL",
      name: "Uscita Lingl",
      line: "LINEA MATTONI",
      plc: "siemens_s7_1500",
      network: "profinet"
    }, {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      code: "CAPACCIOLI",
      name: "Uscita Capaccioli",
      line: "LINEA TEGOLE",
      plc: "siemens_s7_1500",
      network: "profinet"
    }],
    productionEntries: [{
      id: crypto.randomUUID(),
      employee_id: "11111111-1111-4111-8111-111111111111",
      product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      machine_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
      quantity: 1280,
      scrap: 0,
      shift: "mattina",
      notes: "Dato demo locale",
      created_at: now()
    }],
    shipments: []
  };
  return globalThis.solavaLegacyStore;
}
const phaseIds = productionPhases.map((phase) => phase.id);
const loginSchema = z.object({
  matricola: z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9]+$/),
  pin: z.string().trim().min(4).max(10).regex(/^[0-9]+$/),
  phase_id: z.enum(phaseIds)
});
const loginEmployee_createServerFn_handler = createServerRpc({
  id: "69ff350f51ee0238018bcebc6478c818991f98390604875965e4c2098075f9ac",
  name: "loginEmployee",
  filename: "src/lib/mes.functions.ts"
}, (opts) => loginEmployee.__executeServer(opts));
const loginEmployee = createServerFn({
  method: "POST"
}).inputValidator((data) => loginSchema.parse(data)).handler(loginEmployee_createServerFn_handler, async ({
  data
}) => loginOperator(data.matricola, data.pin, data.phase_id));
const getMesOptions_createServerFn_handler = createServerRpc({
  id: "752a5a69b59235bee304f63f73b4f044451546dc4746a860f3e6622ea9e157ab",
  name: "getMesOptions",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getMesOptions.__executeServer(opts));
const getMesOptions = createServerFn({
  method: "GET"
}).handler(getMesOptions_createServerFn_handler, async () => getLoginOptions());
const getPrintQueue_createServerFn_handler = createServerRpc({
  id: "62417faa60b3fd4af62a789c7491878093504367159e5eede56f947ac0d34fb6",
  name: "getPrintQueue",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getPrintQueue.__executeServer(opts));
const getPrintQueue = createServerFn({
  method: "GET"
}).handler(getPrintQueue_createServerFn_handler, async () => getPlcPrintQueue());
const workstationSchema = z.object({
  phase_id: z.enum(phaseIds)
});
const getPhaseWorkstation_createServerFn_handler = createServerRpc({
  id: "ea14f588bf3c9042ba15c6cc942bb3f7dc9fcf5793e29036551b02dd6994d3a3",
  name: "getPhaseWorkstation",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getPhaseWorkstation.__executeServer(opts));
const getPhaseWorkstation = createServerFn({
  method: "POST"
}).inputValidator((data) => workstationSchema.parse(data)).handler(getPhaseWorkstation_createServerFn_handler, async ({
  data
}) => getWorkstation(data.phase_id));
const phaseReceiptSchema = z.object({
  employee_id: z.string().uuid(),
  phase_id: z.enum(phaseIds),
  line_id: z.enum(["mattoni", "tegole"]),
  plc_event_id: z.string().uuid()
});
const confirmPhaseReceipt_createServerFn_handler = createServerRpc({
  id: "eb6ec10f1534f53fc0e0aa7fa0ce77063dc4fcd1a90637bb3d3cb2b7f4014539",
  name: "confirmPhaseReceipt",
  filename: "src/lib/mes.functions.ts"
}, (opts) => confirmPhaseReceipt.__executeServer(opts));
const confirmPhaseReceipt = createServerFn({
  method: "POST"
}).inputValidator((data) => phaseReceiptSchema.parse(data)).handler(confirmPhaseReceipt_createServerFn_handler, async ({
  data
}) => submitPhaseReceipt(data));
const getCatalogs_createServerFn_handler = createServerRpc({
  id: "b34fa1858297b965a3f4b9f006394282d79d19ef9fcbf0beac90633d8a8352ec",
  name: "getCatalogs",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getCatalogs.__executeServer(opts));
const getCatalogs = createServerFn({
  method: "GET"
}).handler(getCatalogs_createServerFn_handler, async () => {
  const db = store();
  return {
    products: db.products,
    machines: db.machines
  };
});
const entrySchema = z.object({
  employee_id: z.string().uuid(),
  product_id: z.string().uuid(),
  machine_id: z.string().uuid(),
  quantity: z.number().int().positive().max(1e6),
  scrap: z.number().int().min(0).max(1e6),
  shift: z.enum(["mattina", "pomeriggio", "notte"]),
  notes: z.string().trim().max(500).optional().nullable()
});
const submitProduction_createServerFn_handler = createServerRpc({
  id: "ceb1e9379b475e155445eeeb49d0ddc99be201e97dcf7f9a01a92fd0dc7ef503",
  name: "submitProduction",
  filename: "src/lib/mes.functions.ts"
}, (opts) => submitProduction.__executeServer(opts));
const submitProduction = createServerFn({
  method: "POST"
}).inputValidator((data) => entrySchema.parse(data)).handler(submitProduction_createServerFn_handler, async ({
  data
}) => {
  const db = store();
  if (!db.employees.some((employee) => employee.id === data.employee_id && employee.active)) {
    return {
      ok: false,
      error: "Dipendente non valido"
    };
  }
  db.productionEntries.unshift({
    ...data,
    id: crypto.randomUUID(),
    created_at: now()
  });
  return {
    ok: true
  };
});
const getDashboard_createServerFn_handler = createServerRpc({
  id: "957fa7000c3c8a2bc649b6b502866baf1260837077eb9536d6c65df96b7500b6",
  name: "getDashboard",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getDashboard.__executeServer(opts));
const getDashboard = createServerFn({
  method: "POST"
}).inputValidator((data) => z.object({
  employee_id: z.string().uuid()
}).parse(data)).handler(getDashboard_createServerFn_handler, async ({
  data
}) => {
  const db = store();
  const recent = db.productionEntries.slice(0, 50).map((entry) => rowForEntry(entry));
  const totalQty = db.productionEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalScrap = db.productionEntries.reduce((sum, entry) => sum + entry.scrap, 0);
  const byMachine = db.machines.map((machine) => ({
    line: machine.line,
    name: machine.name,
    qty: db.productionEntries.filter((entry) => entry.machine_id === machine.id).reduce((sum, entry) => sum + entry.quantity, 0)
  })).filter((row) => row.qty > 0);
  return {
    kpi: {
      totalQty,
      totalScrap,
      scrapRate: totalQty > 0 ? Math.round(totalScrap / (totalQty + totalScrap) * 1e3) / 10 : 0,
      entries24h: db.productionEntries.length
    },
    byMachine,
    recent,
    myRecent: recent.filter((entry) => entry.employee_id === data.employee_id).slice(0, 10).map((entry) => ({
      quantity: entry.quantity,
      scrap: entry.scrap,
      created_at: entry.created_at,
      products: entry.products
    }))
  };
});
function rowForEntry(entry) {
  const db = store();
  const product = db.products.find((item) => item.id === entry.product_id);
  const machine = db.machines.find((item) => item.id === entry.machine_id);
  const employee = db.employees.find((item) => item.id === entry.employee_id);
  return {
    ...entry,
    products: {
      name: product?.name,
      code: product?.code,
      unit: product?.unit
    },
    machines: {
      name: machine?.name,
      line: machine?.line,
      plc: machine?.plc
    },
    employees: {
      full_name: employee?.full_name,
      matricola: employee?.matricola
    }
  };
}
const getEmployeesList_createServerFn_handler = createServerRpc({
  id: "0b09feac485799a8d409fd6b50d9d76c5a5ca5a3f91997beace341dfa78820f6",
  name: "getEmployeesList",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getEmployeesList.__executeServer(opts));
const getEmployeesList = createServerFn({
  method: "GET"
}).handler(getEmployeesList_createServerFn_handler, async () => {
  return {
    employees: store().employees
  };
});
const shipmentSchema = z.object({
  bolla_number: z.string().trim().min(1).max(30),
  carro_number: z.string().trim().min(1).max(30),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(1e6),
  destination: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  employee_id: z.string().uuid()
});
const createShipment_createServerFn_handler = createServerRpc({
  id: "12164837b5a29c1fb0c28fdf8bbbc68e6c64fcade53413c80a1024712111443a",
  name: "createShipment",
  filename: "src/lib/mes.functions.ts"
}, (opts) => createShipment.__executeServer(opts));
const createShipment = createServerFn({
  method: "POST"
}).inputValidator((data) => shipmentSchema.parse(data)).handler(createShipment_createServerFn_handler, async ({
  data
}) => {
  const db = store();
  if (db.shipments.some((item) => item.bolla_number === data.bolla_number && item.carro_number === data.carro_number)) {
    return {
      ok: false,
      error: "Bolla + carro già esistente (duplicato)"
    };
  }
  db.shipments.unshift({
    ...data,
    id: crypto.randomUUID(),
    created_at: now(),
    label_generated_at: now()
  });
  return {
    ok: true
  };
});
const getShipments_createServerFn_handler = createServerRpc({
  id: "475cd6465ec3f70891c317914228ab1c4677519099488a77f8ac956e28d82041",
  name: "getShipments",
  filename: "src/lib/mes.functions.ts"
}, (opts) => getShipments.__executeServer(opts));
const getShipments = createServerFn({
  method: "GET"
}).handler(getShipments_createServerFn_handler, async () => {
  const db = store();
  const shipments = db.shipments.map((shipment) => {
    const product = db.products.find((item) => item.id === shipment.product_id);
    const employee = db.employees.find((item) => item.id === shipment.employee_id);
    return {
      ...shipment,
      products: {
        name: product?.name,
        code: product?.code,
        unit: product?.unit
      },
      employees: {
        full_name: employee?.full_name,
        matricola: employee?.matricola
      }
    };
  });
  return {
    shipments,
    kpi: {
      count24h: shipments.length,
      qty24h: shipments.reduce((sum, shipment) => sum + shipment.quantity, 0)
    }
  };
});
export {
  confirmPhaseReceipt_createServerFn_handler,
  createShipment_createServerFn_handler,
  getCatalogs_createServerFn_handler,
  getDashboard_createServerFn_handler,
  getEmployeesList_createServerFn_handler,
  getMesOptions_createServerFn_handler,
  getPhaseWorkstation_createServerFn_handler,
  getPrintQueue_createServerFn_handler,
  getShipments_createServerFn_handler,
  loginEmployee_createServerFn_handler,
  submitProduction_createServerFn_handler
};
