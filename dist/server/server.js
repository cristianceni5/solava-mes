import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
let lastCapturedError;
const TTL_MS = 5e3;
function record(error) {
  lastCapturedError = { error, at: Date.now() };
}
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record(event.error ?? event));
  globalThis.addEventListener(
    "unhandledrejection",
    (event) => record(event.reason)
  );
}
function consumeLastCapturedError() {
  if (!lastCapturedError) return void 0;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = void 0;
    return void 0;
  }
  const { error } = lastCapturedError;
  lastCapturedError = void 0;
  return error;
}
function renderErrorPage() {
  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <title>Errore MES</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .code { display: inline-block; margin-bottom: 1.5rem; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #fff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Problema: impossibile caricare la pagina</h1>
      <p>Si è verificato un errore interno del MES. Riprova ad aggiornare la pagina; se il problema resta, comunica il codice errore.</p>
      <div class="code">MES-500-SERVER</div>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Riprova</button>
        <a class="secondary" href="/">Torna alla dashboard</a>
      </div>
    </div>
  </body>
</html>`;
}
const productionLines = [
  {
    id: "mattoni",
    name: "LINEA MATTONI",
    output: "Lingl",
    printer: "ETI-MATTONI-01"
  },
  {
    id: "tegole",
    name: "LINEA TEGOLE",
    output: "Capaccioli",
    printer: "ETI-TEGOLE-01"
  }
];
const productionPhases = [
  { id: "verde", name: "Verde" },
  { id: "qc-verde", name: "QC Verde" },
  { id: "secco", name: "Secco" },
  { id: "qc-secco", name: "QC Secco" },
  { id: "cotto", name: "Cotto" },
  { id: "qc-cotto", name: "QC Cotto" },
  { id: "imballaggio", name: "Imballaggio" },
  { id: "fine", name: "Fine" }
];
function getLine(lineId) {
  return productionLines.find((line) => line.id === lineId);
}
const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true, "TSS_DEV_SERVER": "false", "TSS_DEV_SSR_STYLES_BASEPATH": "/", "TSS_DEV_SSR_STYLES_ENABLED": "true", "TSS_INLINE_CSS_ENABLED": "false", "TSS_ROUTER_BASEPATH": "", "TSS_SERVER_FN_BASE": "/_serverFn/" };
let adminClient;
function envValue(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
    const viteEnv = __vite_import_meta_env__;
    const viteValue = viteEnv?.[name];
    if (viteValue) return viteValue;
  }
  return void 0;
}
function getSupabaseConfig() {
  return {
    url: envValue("SUPABASE_URL", "VITE_SUPABASE_URL"),
    publicKey: envValue(
      "SUPABASE_PUBLIC_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_PUBLIC_KEY",
      "VITE_SUPABASE_ANON_KEY"
    ),
    privateKey: envValue("SUPABASE_PRIVATE_KEY", "SUPABASE_SERVICE_ROLE_KEY")
  };
}
function supabaseAdmin() {
  const { url, privateKey } = getSupabaseConfig();
  if (!url || !privateKey) {
    throw new Error(
      "Problema: Supabase non configurato. Codice errore: DB-CONFIG-MANCANTE. Imposta SUPABASE_URL e SUPABASE_PRIVATE_KEY."
    );
  }
  adminClient ??= createClient(url, privateKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return adminClient;
}
function describeSupabaseTarget() {
  const { url } = getSupabaseConfig();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return { host: parsed.host };
  } catch {
    return { host: url };
  }
}
function describeDatabaseError(error) {
  if (error instanceof Error) {
    const cause2 = "cause" in error && error.cause instanceof Error ? ` Causa: ${error.cause.message}.` : "";
    return `Problema: errore Supabase. ${error.message}.${cause2} Codice errore: DB-GENERICO.`;
  }
  if (!error || typeof error !== "object") {
    return "Problema: errore database non classificato. Codice errore: DB-SCONOSCIUTO.";
  }
  const fields = error;
  const code = String(fields.code ?? "GENERICO");
  const message = String(fields.message ?? "");
  const details = String(fields.details ?? "");
  const hint = String(fields.hint ?? "");
  const cause = fields.cause instanceof Error ? fields.cause.message : typeof fields.cause === "string" ? fields.cause : "";
  if (message.includes("fetch failed") || cause.includes("getaddrinfo") || cause.includes("ENOTFOUND")) {
    return "Problema: Supabase non raggiungibile. Verifica SUPABASE_URL, DNS/rete e riavvia il dev server dopo le modifiche al file .env. Codice errore: DB-RETE.";
  }
  if (code === "PGRST116") {
    return "Problema: record Supabase non trovato. Codice errore: DB-PGRST116.";
  }
  if (code === "PGRST202") {
    const detail = [message, details, hint].filter(Boolean).join(" ");
    return detail ? `Problema: funzione RPC Supabase mancante o schema cache non aggiornata. Dettaglio Supabase: ${detail}. Codice errore: DB-PGRST202.` : "Problema: funzione RPC Supabase mancante o schema cache non aggiornata. Esegui db/schema.sql nel SQL Editor e poi ricarica la schema cache Supabase. Codice errore: DB-PGRST202.";
  }
  if (code === "42P01" || message.includes("does not exist")) {
    return "Problema: tabella o funzione Supabase mancante. Applica lo schema del database. Codice errore: DB-42P01.";
  }
  if (code === "23505") {
    return "Problema: vincolo di unicita violato. Il dato esiste gia. Codice errore: DB-23505.";
  }
  if (code === "23503") {
    return "Problema: riferimento collegato mancante. Verifica le chiavi esterne. Codice errore: DB-23503.";
  }
  if (code === "42501" || message.toLowerCase().includes("permission")) {
    return "Problema: permessi Supabase insufficienti. Verifica private key/service role e policy RLS. Codice errore: DB-42501.";
  }
  const suffix = [message, details, hint, cause].filter(Boolean).join(" ");
  return suffix ? `Problema: errore Supabase. ${suffix}. Codice errore: DB-${code}.` : `Problema: errore Supabase. Codice errore: DB-${code}.`;
}
function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}
async function operatorPinHash(matricola, pin) {
  const value = `${matricola.trim()}:${pin.trim()}`;
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("");
  return `\\x${hex}`;
}
function timestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function receiptForClient(row) {
  return {
    ...row,
    employee_id: row.operator_id
  };
}
function handshakeForClient(row) {
  return {
    datoPronte: row?.dato_pronte ?? false,
    datoLetto: row?.dato_letto ?? false,
    lastLabel: row?.last_label ?? null,
    updatedAt: row?.updated_at ?? null
  };
}
function fallbackDepartments() {
  return productionPhases.map((phase, index) => ({
    ...phase,
    sort_order: (index + 1) * 10,
    active: true
  }));
}
async function getDepartments(includeInactive = false) {
  try {
    let query = supabaseAdmin().from("departments").select("id, name, sort_order, active, created_at, updated_at").order("sort_order").order("name");
    if (!includeInactive) query = query.eq("active", true);
    const departments = unwrap(await query);
    return departments.length ? departments : fallbackDepartments();
  } catch (error) {
    const message = describeDatabaseError(error);
    if (message.includes("DB-42P01")) return fallbackDepartments();
    throw error;
  }
}
async function getActiveDepartment(departmentId) {
  const departments = await getDepartments(false);
  return departments.find((department) => department.id === departmentId);
}
async function writeAudit(entry) {
  unwrap(
    await supabaseAdmin().from("audit_log").insert({
      operator_id: entry.operator_id,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id,
      payload: entry.payload
    }).select("id").single()
  );
}
async function loginOperator(matricola, pin, phaseId) {
  const phase = await getActiveDepartment(phaseId);
  if (!phase) return { ok: false, error: "Fase non valida" };
  const employee = unwrap(
    await supabaseAdmin().from("operators").select("id, matricola, full_name, role").eq("matricola", matricola).eq("active", true).eq("pin_hash", await operatorPinHash(matricola, pin)).maybeSingle()
  );
  if (!employee) {
    return { ok: false, error: "Matricola o PIN non validi" };
  }
  await writeAudit({
    operator_id: employee.id,
    action: "LOGIN_OPERATORE",
    entity: "sessione",
    entity_id: phase.id,
    payload: { matricola: employee.matricola, phase_id: phase.id }
  });
  return {
    ok: true,
    employee: {
      id: employee.id,
      matricola: employee.matricola,
      full_name: employee.full_name,
      role: employee.role ?? "operatore",
      phase_id: phase.id,
      phase_name: phase.name
    }
  };
}
async function getLoginOptions() {
  return { phases: await getDepartments(false), lines: productionLines };
}
async function getPlcPrintQueue() {
  const jobs = unwrap(
    await supabaseAdmin().from("print_jobs").select("*").order("created_at", { ascending: false })
  );
  const rows = jobs.map((job) => ({
    ...job,
    line: getLine(job.line_id)
  }));
  return {
    jobs: rows,
    kpi: {
      pending: rows.filter((job) => job.status === "pending").length,
      printing: rows.filter((job) => job.status === "printing").length,
      printed: rows.filter((job) => job.status === "printed").length,
      failed: rows.filter((job) => job.status === "failed").length
    }
  };
}
async function getInventoryOverview() {
  const [packages, auditLog] = await Promise.all([
    supabaseAdmin().from("inventory_packages").select("*").order("created_at", { ascending: false }),
    supabaseAdmin().from("audit_log").select("*").order("created_at", { ascending: false }).limit(30)
  ]);
  const packageRows = unwrap(packages);
  const auditRows = unwrap(auditLog);
  const rows = packageRows.map((item) => ({
    ...item,
    line: getLine(item.line_id),
    lastAudit: auditRows.find(
      (entry) => entry.entity === "magazzino" && entry.entity_id === item.id
    ) ?? null
  }));
  return {
    packages: rows,
    auditLog: auditRows,
    kpi: {
      total: rows.length,
      inStock: rows.filter((item) => item.status === "in_stock").length,
      inProgress: rows.filter((item) => item.status === "in_lavorazione").length,
      shipped: rows.filter((item) => item.status === "spedito").length,
      anomalies: rows.filter((item) => item.status === "anomalia").length
    }
  };
}
async function getSystemDiagnostics() {
  const startedAt = new Date(
    Date.now() - process.uptime() * 1e3
  ).toISOString();
  const config = getSupabaseConfig();
  const dbStatus = await testSupabaseConnection();
  const departments = dbStatus.ok ? await getDepartments(true) : fallbackDepartments();
  const [operators, plcEvents, receipts, printJobs, packages, auditLog] = dbStatus.ok ? await Promise.all([
    countRows("operators"),
    countRows("plc_events"),
    countRows("phase_receipts"),
    countRows("print_jobs"),
    countRows("inventory_packages"),
    countRows("audit_log")
  ]) : [0, 0, 0, 0, 0, 0];
  const production = dbStatus.ok ? await getProductionDiagnostics() : productionLines.map((line) => ({
    ...line,
    handshake: handshakeForClient(null),
    latestEvent: null
  }));
  const [
    recentPlc,
    recentReceipts,
    recentAudit,
    recentPrintJobs,
    recentPackages
  ] = dbStatus.ok ? await Promise.all([
    selectRows("plc_events", 20),
    selectRows("phase_receipts", 20),
    selectRows("audit_log", 30),
    selectRows("print_jobs", 20),
    selectRows("inventory_packages", 50)
  ]) : [[], [], [], [], []];
  return {
    runtime: {
      app: "solava-mes",
      mode: "production",
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      startedAt,
      now: timestamp()
    },
    configuration: {
      supabaseConfigured: Boolean(config.url && config.privateKey),
      supabaseTarget: describeSupabaseTarget(),
      publicKeyConfigured: Boolean(config.publicKey),
      plcTopology: {
        controller: "S7-1500",
        architecture: "PLC unico centrale: gli S7-1200 inviano i dati al S7-1500; i PLC legacy inviano ai S7-1200.",
        protocol: "OPC UA",
        connectionCode: "s7-1500-main"
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
          etichetta: `${line.id.toUpperCase()}-TEST-001`
        }
      }))
    },
    sql: dbStatus,
    supabase: dbStatus,
    production: {
      phases: departments,
      lines: production
    },
    counters: {
      operators,
      plcEvents,
      duplicatePlcEvents: recentPlc.filter((event) => event.duplicate).length,
      phaseReceipts: receipts,
      printJobs,
      inventoryPackages: packages,
      auditEntries: auditLog
    },
    printQueue: {
      pending: recentPrintJobs.filter((job) => job.status === "pending"),
      failed: recentPrintJobs.filter((job) => job.status === "failed"),
      recent: recentPrintJobs
    },
    inventory: {
      packages: recentPackages.map((item) => ({
        ...item,
        line: getLine(item.line_id)
      })),
      anomalies: recentPackages.filter((item) => item.status === "anomalia")
    },
    recent: {
      plcEvents: recentPlc,
      receipts: recentReceipts.map((receipt) => ({
        ...receiptForClient(receipt),
        line: getLine(receipt.line_id),
        phase: departments.find(
          (department) => department.id === receipt.phase_id
        )
      })),
      auditLog: recentAudit
    }
  };
}
async function testSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config.url || !config.privateKey) {
    return {
      ok: false,
      configured: false,
      message: "Problema: Supabase non configurato. Codice errore: DB-CONFIG-MANCANTE.",
      checkedAt: timestamp()
    };
  }
  try {
    const result = await supabaseAdmin().rpc("mes_schema_health").single();
    if (result.error) throw result.error;
    const health = result.data;
    if (!health?.ok) {
      return {
        ok: false,
        configured: true,
        message: `Problema: schema Supabase incompleto. Mancano: ${(health?.missing ?? []).join(", ") || "dettaglio non disponibile"}. Codice errore: DB-SCHEMA-INCOMPLETO.`,
        checkedAt: timestamp()
      };
    }
    return {
      ok: true,
      configured: true,
      database: "supabase",
      schemaOk: true,
      missing: [],
      serverTime: timestamp(),
      checkedAt: health.checked_at ?? timestamp()
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: describeDatabaseError(error),
      checkedAt: timestamp()
    };
  }
}
async function countRows(table) {
  const result = await supabaseAdmin().from(table).select("id", { count: "exact", head: true });
  if (result.error) throw result.error;
  return result.count ?? 0;
}
async function selectRows(table, limit) {
  const result = await supabaseAdmin().from(table).select("*").order("created_at", { ascending: false }).limit(limit);
  return unwrap(result);
}
async function getProductionDiagnostics() {
  const [handshakes, events] = await Promise.all([
    supabaseAdmin().from("line_handshakes").select("*"),
    supabaseAdmin().from("plc_events").select("*").eq("duplicate", false).order("received_at", { ascending: false }).limit(20)
  ]);
  const handshakeRows = unwrap(handshakes);
  const eventRows = unwrap(events);
  return productionLines.map((line) => ({
    ...line,
    handshake: handshakeForClient(
      handshakeRows.find((item) => item.line_id === line.id)
    ),
    latestEvent: eventRows.find(
      (event) => event.line_id === line.id && !event.duplicate
    ) ?? null
  }));
}
async function updateInventoryPackage(input) {
  const pkg = unwrap(
    await supabaseAdmin().from("inventory_packages").select("*").eq("id", input.package_id).maybeSingle()
  );
  if (!pkg) return { ok: false, error: "Pacco non trovato" };
  const updated = unwrap(
    await supabaseAdmin().from("inventory_packages").update({
      status: input.status,
      location: input.location?.trim() || pkg.location,
      updated_at: timestamp()
    }).eq("id", pkg.id).select("*").single()
  );
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
      location: updated.location
    }
  });
  return { ok: true };
}
async function getWorkstation(phaseId) {
  const phase = await getActiveDepartment(phaseId);
  if (!phase) return { phase: null, lines: [], recentReceipts: [] };
  const [events, receipts, printJobs, handshakes] = await Promise.all([
    supabaseAdmin().from("plc_events").select("*").eq("duplicate", false).order("received_at", { ascending: false }).limit(50),
    supabaseAdmin().from("phase_receipts").select("*").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin().from("print_jobs").select("*").order("created_at", { ascending: false }).limit(50),
    supabaseAdmin().from("line_handshakes").select("*")
  ]);
  const eventRows = unwrap(events);
  const receiptRows = unwrap(receipts);
  const jobRows = unwrap(printJobs);
  const handshakeRows = unwrap(handshakes);
  return {
    phase,
    lines: productionLines.map((line) => {
      const latest = eventRows.find((event) => event.line_id === line.id);
      const receipt = latest ? receiptRows.find(
        (item) => item.plc_event_id === latest.id && item.phase_id === phaseId
      ) : void 0;
      const printJob = latest ? jobRows.find(
        (job) => job.plc_event_id === latest.id && job.line_id === line.id
      ) : void 0;
      return {
        ...line,
        handshake: handshakeForClient(
          handshakeRows.find((item) => item.line_id === line.id)
        ),
        latestEvent: latest ?? null,
        receipt: receipt ? receiptForClient(receipt) : null,
        printJob: printJob ?? null
      };
    }),
    recentReceipts: receiptRows.filter((receipt) => receipt.phase_id === phaseId).slice(0, 8).map((receipt) => ({
      ...receiptForClient(receipt),
      line: getLine(receipt.line_id)
    }))
  };
}
async function submitPhaseReceipt(input) {
  const phase = await getActiveDepartment(input.phase_id);
  const line = getLine(input.line_id);
  if (!phase) return { ok: false, error: "Fase non valida" };
  if (!line) return { ok: false, error: "Linea non valida" };
  const event = unwrap(
    await supabaseAdmin().from("plc_events").select("*").eq("id", input.plc_event_id).eq("line_id", input.line_id).eq("duplicate", false).maybeSingle()
  );
  if (!event) return { ok: false, error: "Dato PLC non trovato" };
  const existing = unwrap(
    await supabaseAdmin().from("phase_receipts").select("id").eq("plc_event_id", input.plc_event_id).eq("phase_id", input.phase_id).maybeSingle()
  );
  if (existing) {
    return {
      ok: false,
      error: "Quantita gia versata per questa fase"
    };
  }
  const receipt = unwrap(
    await supabaseAdmin().from("phase_receipts").insert({
      plc_event_id: event.id,
      line_id: input.line_id,
      phase_id: input.phase_id,
      operator_id: input.employee_id,
      quantity: event.quantity,
      label: event.label
    }).select("id").single()
  );
  unwrap(
    await supabaseAdmin().from("department_movements").insert({
      department_id: input.phase_id,
      movement_type: "versamento",
      plc_event_id: event.id,
      phase_receipt_id: receipt.id,
      line_id: input.line_id,
      operator_id: input.employee_id,
      quantity: event.quantity,
      label: event.label
    }).select("id").single()
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
      quantity: event.quantity
    }
  });
  return { ok: true };
}
async function upsertHandshake(lineId, values) {
  unwrap(
    await supabaseAdmin().from("line_handshakes").upsert(
      {
        line_id: lineId,
        ...values,
        updated_at: timestamp()
      },
      { onConflict: "line_id" }
    ).select("line_id").single()
  );
}
async function receivePlcPayload(lineId, payload) {
  const line = getLine(lineId);
  if (!line) {
    return Response.json(
      { errore: "Linea non valida", codice_errore: "PLC-LINEA-404" },
      { status: 404 }
    );
  }
  if (!payload.DatoPronte) {
    await upsertHandshake(lineId, {
      dato_pronte: false,
      dato_letto: false
    });
    return Response.json({ DatoLetto: false });
  }
  if (!Number.isInteger(payload.quantita) || Number(payload.quantita) <= 0) {
    return Response.json(
      {
        errore: "quantita obbligatoria e positiva",
        codice_errore: "PLC-QUANTITA-NON-VALIDA"
      },
      { status: 400 }
    );
  }
  if (!payload.etichetta || typeof payload.etichetta !== "string") {
    return Response.json(
      {
        errore: "etichetta obbligatoria",
        codice_errore: "PLC-ETICHETTA-MANCANTE"
      },
      { status: 400 }
    );
  }
  const oneMinuteAgo = new Date(Date.now() - 6e4).toISOString();
  const duplicate = unwrap(
    await supabaseAdmin().from("plc_events").select("id").eq("line_id", lineId).eq("label", payload.etichetta).gte("received_at", oneMinuteAgo).limit(1)
  );
  await upsertHandshake(lineId, {
    dato_pronte: true,
    dato_letto: true,
    last_label: payload.etichetta
  });
  if (duplicate.length > 0) {
    return Response.json({ DatoLetto: true });
  }
  const event = unwrap(
    await supabaseAdmin().from("plc_events").insert({
      line_id: lineId,
      quantity: payload.quantita,
      label: payload.etichetta,
      dato_pronte: true,
      dato_letto: true,
      duplicate: false
    }).select("*").single()
  );
  const inventoryPackage = unwrap(
    await supabaseAdmin().from("inventory_packages").insert({
      plc_event_id: event.id,
      code: event.label,
      line_id: lineId,
      quantity: event.quantity,
      status: "in_stock",
      location: line.output
    }).select("*").single()
  );
  unwrap(
    await supabaseAdmin().from("print_jobs").insert({
      plc_event_id: event.id,
      line_id: lineId,
      label: event.label,
      quantity: event.quantity,
      printer_name: line.printer,
      status: "pending"
    }).select("id").single()
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
      plc_event_id: event.id
    }
  });
  return Response.json({ DatoLetto: true });
}
async function handlePlcRequest(request, lineId) {
  const line = getLine(lineId);
  if (!line) {
    return Response.json(
      { errore: "Linea non valida", codice_errore: "PLC-LINEA-404" },
      { status: 404 }
    );
  }
  if (request.method !== "POST") {
    return Response.json(
      {
        errore: "Metodo non consentito",
        codice_errore: "PLC-METODO-NON-CONSENTITO"
      },
      { status: 405 }
    );
  }
  try {
    const payload = await request.json();
    return await receivePlcPayload(line.id, payload);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { errore: "JSON non valido", codice_errore: "PLC-JSON-NON-VALIDO" },
        { status: 400 }
      );
    }
    return Response.json(
      {
        errore: describeDatabaseError(error),
        codice_errore: "PLC-DB"
      },
      { status: 500 }
    );
  }
}
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./assets/server-2pRo3n7f.js").then((n) => n.s).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
function brandedErrorResponse() {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
function isCatastrophicSsrErrorBody(body, responseStatus) {
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }
  const fields = payload;
  const expectedKeys = /* @__PURE__ */ new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }
  return fields.unhandled === true && fields.message === "HTTPError" && (fields.status === void 0 || fields.status === responseStatus);
}
async function normalizeCatastrophicSsrResponse(response) {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}
const server = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const plcMatch = url.pathname.match(/^\/api\/plc\/([^/]+)$/);
      if (plcMatch?.[1]) {
        return await handlePlcRequest(request, plcMatch[1]);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  }
};
export {
  getPlcPrintQueue as a,
  getInventoryOverview as b,
  getSystemDiagnostics as c,
  describeDatabaseError as d,
  server as default,
  getWorkstation as e,
  supabaseAdmin as f,
  getLoginOptions as g,
  getDepartments as h,
  unwrap as i,
  loginOperator as l,
  operatorPinHash as o,
  renderErrorPage as r,
  submitPhaseReceipt as s,
  updateInventoryPackage as u
};
