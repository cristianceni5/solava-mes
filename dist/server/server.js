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
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
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
function getPhase(phaseId) {
  return productionPhases.find((phase) => phase.id === phaseId);
}
function timestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function createInitialStore() {
  return {
    employees: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        matricola: "1001",
        pin: "1234",
        full_name: "Operatore Verde"
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        matricola: "1002",
        pin: "2345",
        full_name: "Operatore Secco"
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        matricola: "1003",
        pin: "3456",
        full_name: "Operatore Cotto"
      },
      {
        id: "99999999-9999-4999-8999-999999999999",
        matricola: "9999",
        pin: "0000",
        full_name: "Responsabile Turno"
      }
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
        duplicate: false
      },
      {
        id: crypto.randomUUID(),
        line_id: "tegole",
        quantity: 640,
        label: "TEG-DEMO-001",
        received_at: timestamp(),
        dato_pronte: true,
        dato_letto: true,
        duplicate: false
      }
    ],
    receipts: [],
    printJobs: [],
    handshakes: {
      mattoni: {
        datoPronte: true,
        datoLetto: true,
        lastLabel: "MAT-DEMO-001",
        updatedAt: timestamp()
      },
      tegole: {
        datoPronte: true,
        datoLetto: true,
        lastLabel: "TEG-DEMO-001",
        updatedAt: timestamp()
      }
    }
  };
}
function store() {
  globalThis.solavaMesV1Store ??= createInitialStore();
  return globalThis.solavaMesV1Store;
}
function loginOperator(matricola, pin, phaseId) {
  const phase = getPhase(phaseId);
  if (!phase) return { ok: false, error: "Fase non valida" };
  const employee = store().employees.find(
    (item) => item.matricola === matricola && item.pin === pin
  );
  if (!employee) return { ok: false, error: "Matricola o PIN non validi" };
  return {
    ok: true,
    employee: {
      id: employee.id,
      matricola: employee.matricola,
      full_name: employee.full_name,
      role: "operatore",
      phase_id: phase.id,
      phase_name: phase.name
    }
  };
}
function getLoginOptions() {
  return { phases: productionPhases, lines: productionLines };
}
function getPlcPrintQueue() {
  const db = store();
  const jobs = db.printJobs.map((job) => ({
    ...job,
    line: getLine(job.line_id)
  }));
  return {
    jobs,
    kpi: {
      pending: jobs.filter((job) => job.status === "pending").length,
      printing: jobs.filter((job) => job.status === "printing").length,
      printed: jobs.filter((job) => job.status === "printed").length,
      failed: jobs.filter((job) => job.status === "failed").length
    }
  };
}
function getWorkstation(phaseId) {
  const phase = getPhase(phaseId);
  const db = store();
  return {
    phase,
    lines: productionLines.map((line) => {
      const latest = db.plcEvents.find((event) => event.line_id === line.id && !event.duplicate);
      const receipt = latest ? db.receipts.find((item) => item.plc_event_id === latest.id && item.phase_id === phaseId) : void 0;
      const printJob = latest ? db.printJobs.find((job) => job.plc_event_id === latest.id && job.line_id === line.id) : void 0;
      return {
        ...line,
        handshake: db.handshakes[line.id],
        latestEvent: latest ?? null,
        receipt: receipt ?? null,
        printJob: printJob ?? null
      };
    }),
    recentReceipts: db.receipts.filter((receipt) => receipt.phase_id === phaseId).slice(0, 8).map((receipt) => ({
      ...receipt,
      line: getLine(receipt.line_id)
    }))
  };
}
function submitPhaseReceipt(input) {
  const db = store();
  const phase = getPhase(input.phase_id);
  const line = getLine(input.line_id);
  if (!phase) return { ok: false, error: "Fase non valida" };
  if (!line) return { ok: false, error: "Linea non valida" };
  const event = db.plcEvents.find(
    (item) => item.id === input.plc_event_id && item.line_id === input.line_id && !item.duplicate
  );
  if (!event) return { ok: false, error: "Dato PLC non trovato" };
  const alreadyDone = db.receipts.some(
    (item) => item.plc_event_id === input.plc_event_id && item.phase_id === input.phase_id
  );
  if (alreadyDone) return { ok: false, error: "Quantità già versata per questa fase" };
  db.receipts.unshift({
    id: crypto.randomUUID(),
    plc_event_id: event.id,
    line_id: input.line_id,
    phase_id: input.phase_id,
    employee_id: input.employee_id,
    quantity: event.quantity,
    label: event.label,
    created_at: timestamp()
  });
  return { ok: true };
}
function receivePlcPayload(lineId, payload) {
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
      updatedAt: timestamp()
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
    (event2) => event2.line_id === lineId && event2.label === payload.etichetta && nowMs - new Date(event2.received_at).getTime() <= 6e4
  );
  db.handshakes[lineId] = {
    datoPronte: true,
    datoLetto: true,
    lastLabel: payload.etichetta,
    updatedAt: timestamp()
  };
  if (duplicate) {
    return Response.json({ DatoLetto: true });
  }
  const event = {
    id: crypto.randomUUID(),
    line_id: lineId,
    quantity: payload.quantita,
    label: payload.etichetta,
    received_at: timestamp(),
    dato_pronte: true,
    dato_letto: true,
    duplicate: false
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
    updated_at: timestamp()
  });
  return Response.json({ DatoLetto: true });
}
async function handlePlcRequest(request, lineId) {
  const line = getLine(lineId);
  if (!line) return Response.json({ errore: "Linea non valida" }, { status: 404 });
  if (request.method !== "POST")
    return Response.json({ errore: "Metodo non consentito" }, { status: 405 });
  try {
    const payload = await request.json();
    return receivePlcPayload(line.id, payload);
  } catch {
    return Response.json({ errore: "JSON non valido" }, { status: 400 });
  }
}
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./assets/server-DsZKktrW.js").then((n) => n.s).then(
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
  getWorkstation as b,
  server as default,
  getLoginOptions as g,
  loginOperator as l,
  productionPhases as p,
  renderErrorPage as r,
  submitPhaseReceipt as s
};
