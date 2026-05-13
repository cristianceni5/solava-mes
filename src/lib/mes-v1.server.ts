import {
  getLine,
  getPhase,
  productionLines,
  productionPhases,
  type ProductionLineId,
  type ProductionPhase,
  type ProductionPhaseId,
} from "./mes-v1";
import {
  describeDatabaseError,
  describeSupabaseTarget,
  getSupabaseConfig,
  supabaseAdmin,
  unwrap,
} from "./supabase.server";
import { operatorPinHash } from "./operator-pin";

export type PlcPayload = {
  DatoPronte: boolean;
  quantita?: number;
  etichetta?: string;
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

type PhaseReceiptRow = {
  id: string;
  plc_event_id: string;
  line_id: ProductionLineId;
  phase_id: ProductionPhaseId;
  operator_id: string;
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
  id: string | number;
  operator_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type LineHandshakeRow = {
  line_id: ProductionLineId;
  dato_pronte: boolean;
  dato_letto: boolean;
  last_label: string | null;
  updated_at: string | null;
};

type DepartmentRow = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

function timestamp() {
  return new Date().toISOString();
}

function receiptForClient(row: PhaseReceiptRow) {
  return {
    ...row,
    employee_id: row.operator_id,
  };
}

function handshakeForClient(row?: LineHandshakeRow | null) {
  return {
    datoPronte: row?.dato_pronte ?? false,
    datoLetto: row?.dato_letto ?? false,
    lastLabel: row?.last_label ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function fallbackDepartments(): ProductionPhase[] {
  return productionPhases.map((phase, index) => ({
    ...phase,
    sort_order: (index + 1) * 10,
    active: true,
  }));
}

export async function getDepartments(includeInactive = false) {
  try {
    let query = supabaseAdmin()
      .from("departments")
      .select("id, name, sort_order, active, created_at, updated_at")
      .order("sort_order")
      .order("name");

    if (!includeInactive) query = query.eq("active", true);

    const departments = unwrap(await query) as DepartmentRow[];
    return departments.length ? departments : fallbackDepartments();
  } catch (error) {
    const message = describeDatabaseError(error);
    if (message.includes("DB-42P01")) return fallbackDepartments();
    throw error;
  }
}

async function getActiveDepartment(departmentId: string) {
  const departments = await getDepartments(false);
  return departments.find((department) => department.id === departmentId);
}

async function writeAudit(entry: {
  operator_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
}) {
  unwrap(
    await supabaseAdmin()
      .from("audit_log")
      .insert({
        operator_id: entry.operator_id,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entity_id,
        payload: entry.payload,
      })
      .select("id")
      .single(),
  );
}

export async function loginOperator(
  matricola: string,
  pin: string,
  phaseId: ProductionPhaseId,
) {
  const phase = await getActiveDepartment(phaseId);
  if (!phase) return { ok: false as const, error: "Fase non valida" };

  const employee = unwrap(
    await supabaseAdmin()
      .from("operators")
      .select("id, matricola, full_name, role")
      .eq("matricola", matricola)
      .eq("active", true)
      .eq("pin_hash", await operatorPinHash(matricola, pin))
      .maybeSingle(),
  ) as {
    id: string;
    matricola: string;
    full_name: string;
    role: "operatore" | "magazziniere" | "caporeparto" | "admin";
  } | null;

  if (!employee) {
    return { ok: false as const, error: "Matricola o PIN non validi" };
  }

  await writeAudit({
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
      role: employee.role ?? ("operatore" as const),
      phase_id: phase.id,
      phase_name: phase.name,
    },
  };
}

export async function getLoginOptions() {
  return { phases: await getDepartments(false), lines: productionLines };
}

export async function getPlcPrintQueue() {
  const jobs = unwrap(
    await supabaseAdmin()
      .from("print_jobs")
      .select("*")
      .order("created_at", { ascending: false }),
  ) as PrintJob[];

  const rows = jobs.map((job) => ({
    ...job,
    line: getLine(job.line_id),
  }));

  return {
    jobs: rows,
    kpi: {
      pending: rows.filter((job) => job.status === "pending").length,
      printing: rows.filter((job) => job.status === "printing").length,
      printed: rows.filter((job) => job.status === "printed").length,
      failed: rows.filter((job) => job.status === "failed").length,
    },
  };
}

export async function getInventoryOverview() {
  const [packages, auditLog] = await Promise.all([
    supabaseAdmin()
      .from("inventory_packages")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin()
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const packageRows = unwrap(packages) as InventoryPackage[];
  const auditRows = unwrap(auditLog) as AuditLogEntry[];
  const rows = packageRows.map((item) => ({
    ...item,
    line: getLine(item.line_id),
    lastAudit:
      auditRows.find(
        (entry) => entry.entity === "magazzino" && entry.entity_id === item.id,
      ) ?? null,
  }));

  return {
    packages: rows,
    auditLog: auditRows,
    kpi: {
      total: rows.length,
      inStock: rows.filter((item) => item.status === "in_stock").length,
      inProgress: rows.filter((item) => item.status === "in_lavorazione")
        .length,
      shipped: rows.filter((item) => item.status === "spedito").length,
      anomalies: rows.filter((item) => item.status === "anomalia").length,
    },
  };
}

export async function getSystemDiagnostics() {
  const startedAt = new Date(
    Date.now() - process.uptime() * 1000,
  ).toISOString();
  const config = getSupabaseConfig();
  const dbStatus = await testSupabaseConnection();
  const departments = dbStatus.ok
    ? await getDepartments(true)
    : fallbackDepartments();
  const [operators, plcEvents, receipts, printJobs, packages, auditLog] =
    dbStatus.ok
      ? await Promise.all([
          countRows("operators"),
          countRows("plc_events"),
          countRows("phase_receipts"),
          countRows("print_jobs"),
          countRows("inventory_packages"),
          countRows("audit_log"),
        ])
      : [0, 0, 0, 0, 0, 0];

  const production = dbStatus.ok
    ? await getProductionDiagnostics()
    : productionLines.map((line) => ({
        ...line,
        handshake: handshakeForClient(null),
        latestEvent: null,
      }));

  const [
    recentPlc,
    recentReceipts,
    recentAudit,
    recentPrintJobs,
    recentPackages,
  ] = dbStatus.ok
    ? await Promise.all([
        selectRows<PlcEvent>("plc_events", 20),
        selectRows<PhaseReceiptRow>("phase_receipts", 20),
        selectRows<AuditLogEntry>("audit_log", 30),
        selectRows<PrintJob>("print_jobs", 20),
        selectRows<InventoryPackage>("inventory_packages", 50),
      ])
    : [[], [], [], [], []];

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
      supabaseConfigured: Boolean(config.url && config.privateKey),
      supabaseTarget: describeSupabaseTarget(),
      publicKeyConfigured: Boolean(config.publicKey),
      plcTopology: {
        controller: "S7-1500",
        architecture:
          "PLC unico centrale: gli S7-1200 inviano i dati al S7-1500; i PLC legacy inviano ai S7-1200.",
        protocol: "OPC UA",
        connectionCode: "s7-1500-main",
      },
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
    sql: dbStatus,
    supabase: dbStatus,
    production: {
      phases: departments,
      lines: production,
    },
    counters: {
      operators,
      plcEvents,
      duplicatePlcEvents: recentPlc.filter((event) => event.duplicate).length,
      phaseReceipts: receipts,
      printJobs,
      inventoryPackages: packages,
      auditEntries: auditLog,
    },
    printQueue: {
      pending: recentPrintJobs.filter((job) => job.status === "pending"),
      failed: recentPrintJobs.filter((job) => job.status === "failed"),
      recent: recentPrintJobs,
    },
    inventory: {
      packages: recentPackages.map((item) => ({
        ...item,
        line: getLine(item.line_id),
      })),
      anomalies: recentPackages.filter((item) => item.status === "anomalia"),
    },
    recent: {
      plcEvents: recentPlc,
      receipts: recentReceipts.map((receipt) => ({
        ...receiptForClient(receipt),
        line: getLine(receipt.line_id),
        phase: departments.find(
          (department) => department.id === receipt.phase_id,
        ),
      })),
      auditLog: recentAudit,
    },
  };
}

async function testSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config.url || !config.privateKey) {
    return {
      ok: false,
      configured: false,
      message:
        "Problema: Supabase non configurato. Codice errore: DB-CONFIG-MANCANTE.",
      checkedAt: timestamp(),
    };
  }

  try {
    const result = await supabaseAdmin().rpc("mes_schema_health").single();
    if (result.error) throw result.error;
    const health = result.data as {
      ok: boolean;
      missing: string[] | null;
      checked_at: string;
    } | null;

    if (!health?.ok) {
      return {
        ok: false,
        configured: true,
        message: `Problema: schema Supabase incompleto. Mancano: ${(health?.missing ?? []).join(", ") || "dettaglio non disponibile"}. Codice errore: DB-SCHEMA-INCOMPLETO.`,
        checkedAt: timestamp(),
      };
    }

    return {
      ok: true,
      configured: true,
      database: "supabase",
      schemaOk: true,
      missing: [],
      serverTime: timestamp(),
      checkedAt: health.checked_at ?? timestamp(),
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

async function countRows(table: string) {
  const result = await supabaseAdmin()
    .from(table)
    .select("id", { count: "exact", head: true });
  if (result.error) throw result.error;
  return result.count ?? 0;
}

async function selectRows<T>(table: string, limit: number) {
  const result = await supabaseAdmin()
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap(result) as T[];
}

async function getProductionDiagnostics() {
  const [handshakes, events] = await Promise.all([
    supabaseAdmin().from("line_handshakes").select("*"),
    supabaseAdmin()
      .from("plc_events")
      .select("*")
      .eq("duplicate", false)
      .order("received_at", { ascending: false })
      .limit(20),
  ]);
  const handshakeRows = unwrap(handshakes) as LineHandshakeRow[];
  const eventRows = unwrap(events) as PlcEvent[];

  return productionLines.map((line) => ({
    ...line,
    handshake: handshakeForClient(
      handshakeRows.find((item) => item.line_id === line.id),
    ),
    latestEvent:
      eventRows.find(
        (event) => event.line_id === line.id && !event.duplicate,
      ) ?? null,
  }));
}

export async function updateInventoryPackage(input: {
  package_id: string;
  operator_id: string;
  status: InventoryPackage["status"];
  location?: string | null;
}) {
  const pkg = unwrap(
    await supabaseAdmin()
      .from("inventory_packages")
      .select("*")
      .eq("id", input.package_id)
      .maybeSingle(),
  ) as InventoryPackage | null;

  if (!pkg) return { ok: false as const, error: "Pacco non trovato" };

  const updated = unwrap(
    await supabaseAdmin()
      .from("inventory_packages")
      .update({
        status: input.status,
        location: input.location?.trim() || pkg.location,
        updated_at: timestamp(),
      })
      .eq("id", pkg.id)
      .select("*")
      .single(),
  ) as InventoryPackage;

  await writeAudit({
    operator_id: input.operator_id,
    action: "AGGIORNA_PACCO",
    entity: "magazzino",
    entity_id: pkg.id,
    payload: {
      code: pkg.code,
      line_id: pkg.line_id,
      old_status: pkg.status,
      new_status: updated.status,
      location: updated.location,
    },
  });

  return { ok: true as const };
}

export async function getWorkstation(phaseId: ProductionPhaseId) {
  const phase = await getActiveDepartment(phaseId);
  if (!phase) return { phase: null, lines: [], recentReceipts: [] };
  const [events, receipts, printJobs, handshakes] = await Promise.all([
    supabaseAdmin()
      .from("plc_events")
      .select("*")
      .eq("duplicate", false)
      .order("received_at", { ascending: false })
      .limit(50),
    supabaseAdmin()
      .from("phase_receipts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin()
      .from("print_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin().from("line_handshakes").select("*"),
  ]);

  const eventRows = unwrap(events) as PlcEvent[];
  const receiptRows = unwrap(receipts) as PhaseReceiptRow[];
  const jobRows = unwrap(printJobs) as PrintJob[];
  const handshakeRows = unwrap(handshakes) as LineHandshakeRow[];

  return {
    phase,
    lines: productionLines.map((line) => {
      const latest = eventRows.find((event) => event.line_id === line.id);
      const receipt = latest
        ? receiptRows.find(
            (item) =>
              item.plc_event_id === latest.id && item.phase_id === phaseId,
          )
        : undefined;
      const printJob = latest
        ? jobRows.find(
            (job) => job.plc_event_id === latest.id && job.line_id === line.id,
          )
        : undefined;

      return {
        ...line,
        handshake: handshakeForClient(
          handshakeRows.find((item) => item.line_id === line.id),
        ),
        latestEvent: latest ?? null,
        receipt: receipt ? receiptForClient(receipt) : null,
        printJob: printJob ?? null,
      };
    }),
    recentReceipts: receiptRows
      .filter((receipt) => receipt.phase_id === phaseId)
      .slice(0, 8)
      .map((receipt) => ({
        ...receiptForClient(receipt),
        line: getLine(receipt.line_id),
      })),
  };
}

export async function submitPhaseReceipt(input: {
  employee_id: string;
  phase_id: ProductionPhaseId;
  line_id: ProductionLineId;
  plc_event_id: string;
}) {
  const phase = await getActiveDepartment(input.phase_id);
  const line = getLine(input.line_id);
  if (!phase) return { ok: false as const, error: "Fase non valida" };
  if (!line) return { ok: false as const, error: "Linea non valida" };

  const event = unwrap(
    await supabaseAdmin()
      .from("plc_events")
      .select("*")
      .eq("id", input.plc_event_id)
      .eq("line_id", input.line_id)
      .eq("duplicate", false)
      .maybeSingle(),
  ) as PlcEvent | null;
  if (!event) return { ok: false as const, error: "Dato PLC non trovato" };

  const existing = unwrap(
    await supabaseAdmin()
      .from("phase_receipts")
      .select("id")
      .eq("plc_event_id", input.plc_event_id)
      .eq("phase_id", input.phase_id)
      .maybeSingle(),
  ) as { id: string } | null;
  if (existing) {
    return {
      ok: false as const,
      error: "Quantita gia versata per questa fase",
    };
  }

  const receipt = unwrap(
    await supabaseAdmin()
      .from("phase_receipts")
      .insert({
        plc_event_id: event.id,
        line_id: input.line_id,
        phase_id: input.phase_id,
        operator_id: input.employee_id,
        quantity: event.quantity,
        label: event.label,
      })
      .select("id")
      .single(),
  ) as { id: string };

  unwrap(
    await supabaseAdmin()
      .from("department_movements")
      .insert({
        department_id: input.phase_id,
        movement_type: "versamento",
        plc_event_id: event.id,
        phase_receipt_id: receipt.id,
        line_id: input.line_id,
        operator_id: input.employee_id,
        quantity: event.quantity,
        label: event.label,
      })
      .select("id")
      .single(),
  );

  await writeAudit({
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

async function upsertHandshake(
  lineId: ProductionLineId,
  values: {
    dato_pronte: boolean;
    dato_letto: boolean;
    last_label?: string | null;
  },
) {
  unwrap(
    await supabaseAdmin()
      .from("line_handshakes")
      .upsert(
        {
          line_id: lineId,
          ...values,
          updated_at: timestamp(),
        },
        { onConflict: "line_id" },
      )
      .select("line_id")
      .single(),
  );
}

export async function receivePlcPayload(
  lineId: ProductionLineId,
  payload: PlcPayload,
) {
  const line = getLine(lineId);
  if (!line) {
    return Response.json(
      { errore: "Linea non valida", codice_errore: "PLC-LINEA-404" },
      { status: 404 },
    );
  }

  if (!payload.DatoPronte) {
    await upsertHandshake(lineId, {
      dato_pronte: false,
      dato_letto: false,
    });
    return Response.json({ DatoLetto: false });
  }

  if (!Number.isInteger(payload.quantita) || Number(payload.quantita) <= 0) {
    return Response.json(
      {
        errore: "quantita obbligatoria e positiva",
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

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const duplicate = unwrap(
    await supabaseAdmin()
      .from("plc_events")
      .select("id")
      .eq("line_id", lineId)
      .eq("label", payload.etichetta)
      .gte("received_at", oneMinuteAgo)
      .limit(1),
  ) as { id: string }[];

  await upsertHandshake(lineId, {
    dato_pronte: true,
    dato_letto: true,
    last_label: payload.etichetta,
  });

  if (duplicate.length > 0) {
    return Response.json({ DatoLetto: true });
  }

  const event = unwrap(
    await supabaseAdmin()
      .from("plc_events")
      .insert({
        line_id: lineId,
        quantity: payload.quantita,
        label: payload.etichetta,
        dato_pronte: true,
        dato_letto: true,
        duplicate: false,
      })
      .select("*")
      .single(),
  ) as PlcEvent;

  const inventoryPackage = unwrap(
    await supabaseAdmin()
      .from("inventory_packages")
      .insert({
        plc_event_id: event.id,
        code: event.label,
        line_id: lineId,
        quantity: event.quantity,
        status: "in_stock",
        location: line.output,
      })
      .select("*")
      .single(),
  ) as InventoryPackage;

  unwrap(
    await supabaseAdmin()
      .from("print_jobs")
      .insert({
        plc_event_id: event.id,
        line_id: lineId,
        label: event.label,
        quantity: event.quantity,
        printer_name: line.printer,
        status: "pending",
      })
      .select("id")
      .single(),
  );

  await writeAudit({
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
  if (!line) {
    return Response.json(
      { errore: "Linea non valida", codice_errore: "PLC-LINEA-404" },
      { status: 404 },
    );
  }
  if (request.method !== "POST") {
    return Response.json(
      {
        errore: "Metodo non consentito",
        codice_errore: "PLC-METODO-NON-CONSENTITO",
      },
      { status: 405 },
    );
  }

  try {
    const payload = (await request.json()) as PlcPayload;
    return await receivePlcPayload(line.id, payload);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { errore: "JSON non valido", codice_errore: "PLC-JSON-NON-VALIDO" },
        { status: 400 },
      );
    }

    return Response.json(
      {
        errore: describeDatabaseError(error),
        codice_errore: "PLC-DB",
      },
      { status: 500 },
    );
  }
}
