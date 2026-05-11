import {
  getLine,
  getPhase,
  productionLines,
  productionPhases,
  type ProductionLineId,
  type ProductionPhaseId,
} from "./mes-v1";

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
  handshakes: Record<ProductionLineId, LineHandshake>;
};

declare global {
  var solavaMesV1Store: MesStore | undefined;
}

function timestamp() {
  return new Date().toISOString();
}

function createInitialStore(): MesStore {
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
        id: crypto.randomUUID(),
        line_id: "mattoni",
        quantity: 1280,
        label: "MAT-DEMO-001",
        received_at: timestamp(),
        dato_pronte: true,
        dato_letto: true,
        duplicate: false,
      },
      {
        id: crypto.randomUUID(),
        line_id: "tegole",
        quantity: 640,
        label: "TEG-DEMO-001",
        received_at: timestamp(),
        dato_pronte: true,
        dato_letto: true,
        duplicate: false,
      },
    ],
    receipts: [],
    printJobs: [],
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

export function loginOperator(matricola: string, pin: string, phaseId: ProductionPhaseId) {
  const phase = getPhase(phaseId);
  if (!phase) return { ok: false as const, error: "Fase non valida" };

  const employee = store().employees.find(
    (item) => item.matricola === matricola && item.pin === pin,
  );
  if (!employee) return { ok: false as const, error: "Matricola o PIN non validi" };

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

export function getWorkstation(phaseId: ProductionPhaseId) {
  const phase = getPhase(phaseId);
  const db = store();

  return {
    phase,
    lines: productionLines.map((line) => {
      const latest = db.plcEvents.find((event) => event.line_id === line.id && !event.duplicate);
      const receipt = latest
        ? db.receipts.find((item) => item.plc_event_id === latest.id && item.phase_id === phaseId)
        : undefined;
      const printJob = latest
        ? db.printJobs.find((job) => job.plc_event_id === latest.id && job.line_id === line.id)
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
    (item) => item.id === input.plc_event_id && item.line_id === input.line_id && !item.duplicate,
  );
  if (!event) return { ok: false as const, error: "Dato PLC non trovato" };

  const alreadyDone = db.receipts.some(
    (item) => item.plc_event_id === input.plc_event_id && item.phase_id === input.phase_id,
  );
  if (alreadyDone) return { ok: false as const, error: "Quantità già versata per questa fase" };

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

  return { ok: true as const };
}

export function receivePlcPayload(lineId: ProductionLineId, payload: PlcPayload) {
  const db = store();
  const line = getLine(lineId);
  if (!line) {
    return Response.json({ errore: "Linea non valida" }, { status: 404 });
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
    return Response.json({ errore: "quantita obbligatoria e positiva" }, { status: 400 });
  }
  if (!payload.etichetta || typeof payload.etichetta !== "string") {
    return Response.json({ errore: "etichetta obbligatoria" }, { status: 400 });
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

  return Response.json({ DatoLetto: true });
}

export async function handlePlcRequest(request: Request, lineId: string) {
  const line = getLine(lineId);
  if (!line) return Response.json({ errore: "Linea non valida" }, { status: 404 });
  if (request.method !== "POST")
    return Response.json({ errore: "Metodo non consentito" }, { status: 405 });

  try {
    const payload = (await request.json()) as PlcPayload;
    return receivePlcPayload(line.id, payload);
  } catch {
    return Response.json({ errore: "JSON non valido" }, { status: 400 });
  }
}
