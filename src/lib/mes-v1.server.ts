import {
  getLine,
  getPhase,
  productionLines,
  productionPhases,
  type ProductionLineId,
  type ProductionPhaseId,
} from "./mes-v1";
import { describeDatabaseError, query } from "./db.server";

export type PlcPayload = {
  DatoPronte: boolean;
  quantita?: number;
  etichetta?: string;
};

type Employee = {
  id: string;
  matricola: string;
  pin: string;
  full_name: string;
};

type PlcEvent = {
  id: string;
  line_id: ProductionLineId;
  quantity: number;
  label: string;
  received_at: string;
  dato_pronte: boolean;
  dato_letto: boolean;
  duplicate: boolean;
};

type PhaseReceipt = {
  id: string;
  plc_event_id: string;
  line_id: ProductionLineId;
  phase_id: ProductionPhaseId;
  employee_id: string;
  quantity: number;
  label: string;
  created_at: string;
};

type PrintJob = {
  id: string;
  plc_event_id: string;
  line_id: ProductionLineId;
  label: string;
  quantity: number;
  printer_name: string;
  status: "pending" | "printing" | "printed" | "failed";
  attempts: number;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type InventoryPackage = {
  id: string;
  plc_event_id: string;
  code: string;
  line_id: ProductionLineId;
  quantity: number;
  status: "in_stock" | "in_lavorazione" | "spedito" | "anomalia";
  location: string | null;
  created_at: string;
  updated_at: string;
};

type AuditLogEntry = {
  id: string;
  operator_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

type LineHandshake = {
  datoPronte: boolean;
  datoLetto: boolean;
  lastLabel: string | null;
  updatedAt: string | null;
};

type MesStore = {
  employees: Employee[];
  plcEvents: PlcEvent[];
  receipts: PhaseReceipt[];
  printJobs: PrintJob[];
  inventoryPackages: InventoryPackage[];
  auditLog: AuditLogEntry[];
  handshakes: Record<ProductionLineId, LineHandshake>;
};

declare global {
  var solavaMesV1Store: MesStore | undefined;
}

function timestamp() {
  return new Date().toISOString();
}

function createInitialStore(): MesStore {
  const mattoniEventId = crypto.randomUUID();
  const tegoleEventId = crypto.randomUUID();
  const createdAt = timestamp();

  return {
    employees: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        matricola: "1001",
        pin: "1234",
        full_name: "Operatore Verde",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        matricola: "1002",
        pin: "2345",
        full_name: "Operatore Secco",
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        matricola: "1003",
        pin: "3456",
        full_name: "Operatore Cotto",
      },
      {
        id: "99999999-9999-4999-8999-999999999999",
        matricola: "9999",
        pin: "0000",
        full_name: "Responsabile Turno",
      },
    ],
    plcEvents: [
      {
        id: mattoniEventId,
        line_id: "mattoni",
        quantity: 1280,
        label: "MAT-DEMO-001",
        received_at: createdAt,
        dato_pronte: true,
        dato_letto: true,
        duplicate: false,
      },
      {
        id: tegoleEventId,
        line_id: "tegole",
        quantity: 640,
        label: "TEG-DEMO-001",
        received_at: createdAt,
        dato_pronte: true,
        dato_letto: true,
        duplicate: false,
      },
    ],
    receipts: [],
    printJobs: [],
    inventoryPackages: [
      {
        id: crypto.randomUUID(),
        plc_event_id: mattoniEventId,
        code: "MAT-DEMO-001",
        line_id: "mattoni",
        quantity: 1280,
        status: "in_stock",
        location: "Area imballaggio",
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: crypto.randomUUID(),
        plc_event_id: tegoleEventId,
        code: "TEG-DEMO-001",
        line_id: "tegole",
        quantity: 640,
        status: "in_lavorazione",
        location: "Linea tegole",
        created_at: createdAt,
        updated_at: createdAt,
      },
    ],
    auditLog: [],
    handshakes: {
      mattoni: {
        datoPronte: true,
        datoLetto: true,
        lastLabel: "MAT-DEMO-001",
        updatedAt: timestamp(),
      },
      tegole: {
        datoPronte: true,
        datoLetto: true,
        lastLabel: "TEG-DEMO-001",
        updatedAt: timestamp(),
      },
    },
  };
}

function store() {
  globalThis.solavaMesV1Store ??= createInitialStore();
  return globalThis.solavaMesV1Store;
}

function writeAudit(entry: Omit<AuditLogEntry, "id" | "created_at">) {
  store().auditLog.unshift({
    ...entry,
    id: crypto.randomUUID(),
    created_at: timestamp(),
  });
}

export function loginOperator(
  matricola: string,
  pin: string,
  phaseId: ProductionPhaseId,
) {
  const phase = getPhase(phaseId);
  if (!phase) return { ok: false as const, error: "Fase non valida" };

  const employee = store().employees.find(
    (item) => item.matricola === matricola && item.pin === pin,
  );
  if (!employee)
    return { ok: false as const, error: "Matricola o PIN non validi" };

  writeAudit({
    operator_id: employee.id,
    action: "LOGIN_OPERATORE",
    entity: "sessione",
    entity_id: phase.id,
    payload: { matricola: employee.matricola, phase_id: phase.id },
  });

  return {
    ok: true as const,
    employee: {
      id: employee.id,
      matricola: employee.matricola,
      full_name: employee.full_name,
      role: "operatore" as const,
      phase_id: phase.id,
      phase_name: phase.name,
    },
  };
}

export function getLoginOptions() {
  return { phases: productionPhases, lines: productionLines };
}

export function getPlcPrintQueue() {
  const db = store();
  const jobs = db.printJobs.map((job) => ({
    ...job,
    line: getLine(job.line_id),
  }));
  return {
    jobs,
    kpi: {
      pending: jobs.filter((job) => job.status === "pending").length,
      printing: jobs.filter((job) => job.status === "printing").length,
      printed: jobs.filter((job) => job.status === "printed").length,
      failed: jobs.filter((job) => job.status === "failed").length,
    },
  };
}

export function getInventoryOverview() {
  const db = store();
  const packages = db.inventoryPackages.map((item) => ({
    ...item,
    line: getLine(item.line_id),
    lastAudit: db.auditLog.find(
      (entry) => entry.entity === "magazzino" && entry.entity_id === item.id,
    ),
  }));

  return {
    packages,
    auditLog: db.auditLog.slice(0, 30),
    kpi: {
      total: packages.length,
      inStock: packages.filter((item) => item.status === "in_stock").length,
      inProgress: packages.filter((item) => item.status === "in_lavorazione")
        .length,
      shipped: packages.filter((item) => item.status === "spedito").length,
      anomalies: packages.filter((item) => item.status === "anomalia").length,
    },
  };
}

export async function getSystemDiagnostics() {
  const db = store();
  const startedAt = new Date(
    Date.now() - process.uptime() * 1000,
  ).toISOString();
  const sqlConnectionString = process.env.SQLSERVER_CONNECTION_STRING;
  const sqlStatus = await testSqlConnection(sqlConnectionString);

  return {
    runtime: {
      app: "solava-mes",
      mode: process.env.NODE_ENV ?? "development",
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      startedAt,
      now: timestamp(),
    },
    configuration: {
      sqlServerConfigured: Boolean(sqlConnectionString),
      sqlServerTarget: describeSqlTarget(sqlConnectionString),
      plcHttpPort: 8031,
      plcEndpoints: productionLines.map((line) => ({
        line_id: line.id,
        line_name: line.name,
        endpoint: `/api/plc/${line.id}`,
        method: "POST",
        payload: {
          DatoPronte: true,
          quantita: 100,
          etichetta: `${line.id.toUpperCase()}-TEST-001`,
        },
      })),
    },
    sql: sqlStatus,
    production: {
      phases: productionPhases,
      lines: productionLines.map((line) => ({
        ...line,
        handshake: db.handshakes[line.id],
        latestEvent:
          db.plcEvents.find(
            (event) => event.line_id === line.id && !event.duplicate,
          ) ?? null,
      })),
    },
    counters: {
      operators: db.employees.length,
      plcEvents: db.plcEvents.length,
      duplicatePlcEvents: db.plcEvents.filter((event) => event.duplicate)
        .length,
      phaseReceipts: db.receipts.length,
      printJobs: db.printJobs.length,
      inventoryPackages: db.inventoryPackages.length,
      auditEntries: db.auditLog.length,
    },
    printQueue: {
      pending: db.printJobs.filter((job) => job.status === "pending"),
      failed: db.printJobs.filter((job) => job.status === "failed"),
      recent: db.printJobs.slice(0, 20),
    },
    inventory: {
      packages: db.inventoryPackages.slice(0, 50).map((item) => ({
        ...item,
        line: getLine(item.line_id),
      })),
      anomalies: db.inventoryPackages.filter(
        (item) => item.status === "anomalia",
      ),
    },
    recent: {
      plcEvents: db.plcEvents.slice(0, 20),
      receipts: db.receipts.slice(0, 20).map((receipt) => ({
        ...receipt,
        line: getLine(receipt.line_id),
        phase: getPhase(receipt.phase_id),
      })),
      auditLog: db.auditLog.slice(0, 30),
    },
  };
}

async function testSqlConnection(connectionString: string | undefined) {
  if (!connectionString) {
    return {
      ok: false,
      configured: false,
      message:
        "Problema: connessione SQL Server non configurata. Codice errore: DB-CONFIG-MANCANTE.",
      checkedAt: timestamp(),
    };
  }

  try {
    const result = await query<{ db_name: string; server_time: Date }>(
      "SELECT DB_NAME() as db_name, SYSDATETIME() as server_time",
    );
    return {
      ok: true,
      configured: true,
      database: result.rows[0]?.db_name ?? null,
      serverTime: result.rows[0]?.server_time ?? null,
      checkedAt: timestamp(),
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: describeDatabaseError(error),
      checkedAt: timestamp(),
    };
  }
}

function describeSqlTarget(connectionString: string | undefined) {
  if (!connectionString) return null;
  const server =
    connectionString.match(/(?:server|data source)\s*=\s*([^;]+)/i)?.[1] ??
    null;
  const database =
    connectionString.match(
      /(?:database|initial catalog)\s*=\s*([^;]+)/i,
    )?.[1] ?? null;
  return { server, database };
}

export function updateInventoryPackage(input: {
  package_id: string;
  operator_id: string;
  status: InventoryPackage["status"];
  location?: string | null;
}) {
  const db = store();
  const pkg = db.inventoryPackages.find((item) => item.id === input.package_id);
  if (!pkg) return { ok: false as const, error: "Pacco non trovato" };

  const oldStatus = pkg.status;
  pkg.status = input.status;
  pkg.location = input.location?.trim() || pkg.location;
  pkg.updated_at = timestamp();

  writeAudit({
    operator_id: input.operator_id,
    action: "AGGIORNA_PACCO",
    entity: "magazzino",
    entity_id: pkg.id,
    payload: {
      code: pkg.code,
      line_id: pkg.line_id,
      old_status: oldStatus,
      new_status: pkg.status,
      location: pkg.location,
    },
  });

  return { ok: true as const };
}

export function getWorkstation(phaseId: ProductionPhaseId) {
  const phase = getPhase(phaseId);
  const db = store();

  return {
    phase,
    lines: productionLines.map((line) => {
      const latest = db.plcEvents.find(
        (event) => event.line_id === line.id && !event.duplicate,
      );
      const receipt = latest
        ? db.receipts.find(
            (item) =>
              item.plc_event_id === latest.id && item.phase_id === phaseId,
          )
        : undefined;
      const printJob = latest
        ? db.printJobs.find(
            (job) => job.plc_event_id === latest.id && job.line_id === line.id,
          )
        : undefined;

      return {
        ...line,
        handshake: db.handshakes[line.id],
        latestEvent: latest ?? null,
        receipt: receipt ?? null,
        printJob: printJob ?? null,
      };
    }),
    recentReceipts: db.receipts
      .filter((receipt) => receipt.phase_id === phaseId)
      .slice(0, 8)
      .map((receipt) => ({
        ...receipt,
        line: getLine(receipt.line_id),
      })),
  };
}

export function submitPhaseReceipt(input: {
  employee_id: string;
  phase_id: ProductionPhaseId;
  line_id: ProductionLineId;
  plc_event_id: string;
}) {
  const db = store();
  const phase = getPhase(input.phase_id);
  const line = getLine(input.line_id);
  if (!phase) return { ok: false as const, error: "Fase non valida" };
  if (!line) return { ok: false as const, error: "Linea non valida" };

  const event = db.plcEvents.find(
    (item) =>
      item.id === input.plc_event_id &&
      item.line_id === input.line_id &&
      !item.duplicate,
  );
  if (!event) return { ok: false as const, error: "Dato PLC non trovato" };

  const alreadyDone = db.receipts.some(
    (item) =>
      item.plc_event_id === input.plc_event_id &&
      item.phase_id === input.phase_id,
  );
  if (alreadyDone)
    return {
      ok: false as const,
      error: "Quantità già versata per questa fase",
    };

  db.receipts.unshift({
    id: crypto.randomUUID(),
    plc_event_id: event.id,
    line_id: input.line_id,
    phase_id: input.phase_id,
    employee_id: input.employee_id,
    quantity: event.quantity,
    label: event.label,
    created_at: timestamp(),
  });

  writeAudit({
    operator_id: input.employee_id,
    action: "VERSAMENTO_FASE",
    entity: "versamento",
    entity_id: event.id,
    payload: {
      phase_id: input.phase_id,
      line_id: input.line_id,
      label: event.label,
      quantity: event.quantity,
    },
  });

  return { ok: true as const };
}

export function receivePlcPayload(
  lineId: ProductionLineId,
  payload: PlcPayload,
) {
  const db = store();
  const line = getLine(lineId);
  if (!line) {
    return Response.json(
      { errore: "Linea non valida", codice_errore: "PLC-LINEA-404" },
      { status: 404 },
    );
  }

  if (!payload.DatoPronte) {
    db.handshakes[lineId] = {
      datoPronte: false,
      datoLetto: false,
      lastLabel: db.handshakes[lineId].lastLabel,
      updatedAt: timestamp(),
    };
    return Response.json({ DatoLetto: false });
  }

  if (!Number.isInteger(payload.quantita) || Number(payload.quantita) <= 0) {
    return Response.json(
      {
        errore: "quantità obbligatoria e positiva",
        codice_errore: "PLC-QUANTITA-NON-VALIDA",
      },
      { status: 400 },
    );
  }
  if (!payload.etichetta || typeof payload.etichetta !== "string") {
    return Response.json(
      {
        errore: "etichetta obbligatoria",
        codice_errore: "PLC-ETICHETTA-MANCANTE",
      },
      { status: 400 },
    );
  }

  const nowMs = Date.now();
  const duplicate = db.plcEvents.some(
    (event) =>
      event.line_id === lineId &&
      event.label === payload.etichetta &&
      nowMs - new Date(event.received_at).getTime() <= 60_000,
  );

  db.handshakes[lineId] = {
    datoPronte: true,
    datoLetto: true,
    lastLabel: payload.etichetta,
    updatedAt: timestamp(),
  };

  if (duplicate) {
    return Response.json({ DatoLetto: true });
  }

  const event: PlcEvent = {
    id: crypto.randomUUID(),
    line_id: lineId,
    quantity: payload.quantita,
    label: payload.etichetta,
    received_at: timestamp(),
    dato_pronte: true,
    dato_letto: true,
    duplicate: false,
  };
  db.plcEvents.unshift(event);

  const inventoryPackage: InventoryPackage = {
    id: crypto.randomUUID(),
    plc_event_id: event.id,
    code: event.label,
    line_id: lineId,
    quantity: event.quantity,
    status: "in_stock",
    location: line.output,
    created_at: timestamp(),
    updated_at: timestamp(),
  };
  db.inventoryPackages.unshift(inventoryPackage);

  db.printJobs.unshift({
    id: crypto.randomUUID(),
    plc_event_id: event.id,
    line_id: lineId,
    label: event.label,
    quantity: event.quantity,
    printer_name: line.printer,
    status: "pending",
    attempts: 0,
    error_code: null,
    error_message: null,
    created_at: timestamp(),
    updated_at: timestamp(),
  });

  writeAudit({
    operator_id: null,
    action: "PLC_PACCO_CREATO",
    entity: "magazzino",
    entity_id: inventoryPackage.id,
    payload: {
      code: inventoryPackage.code,
      line_id: inventoryPackage.line_id,
      quantity: inventoryPackage.quantity,
      plc_event_id: event.id,
    },
  });

  return Response.json({ DatoLetto: true });
}

export async function handlePlcRequest(request: Request, lineId: string) {
  const line = getLine(lineId);
  if (!line)
    return Response.json(
      { errore: "Linea non valida", codice_errore: "PLC-LINEA-404" },
      { status: 404 },
    );
  if (request.method !== "POST")
    return Response.json(
      {
        errore: "Metodo non consentito",
        codice_errore: "PLC-METODO-NON-CONSENTITO",
      },
      { status: 405 },
    );

  try {
    const payload = (await request.json()) as PlcPayload;
    return receivePlcPayload(line.id, payload);
  } catch {
    return Response.json(
      { errore: "JSON non valido", codice_errore: "PLC-JSON-NON-VALIDO" },
      { status: 400 },
    );
  }
}
