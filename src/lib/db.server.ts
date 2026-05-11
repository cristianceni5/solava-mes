import sql from "mssql";

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

let poolPromise: Promise<sql.ConnectionPool> | undefined;

function getConnectionString() {
  const value = process.env.SQLSERVER_CONNECTION_STRING;
  if (!value) {
    throw new Error(
      "Problema: connessione SQL Server non configurata. Codice errore: DB-CONFIG-MANCANTE. Imposta SQLSERVER_CONNECTION_STRING.",
    );
  }
  return value;
}

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getConnectionString())
      .connect()
      .catch((error) => {
        poolPromise = undefined;
        throw error;
      });
  }
  return poolPromise;
}

function normalizeSql(text: string) {
  return text.replace(/\$(\d+)/g, "@p$1");
}

function bindValue(request: sql.Request, name: string, value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    request.input(name, sql.Int, value);
    return;
  }
  if (typeof value === "number") {
    request.input(name, sql.Decimal(18, 4), value);
    return;
  }
  if (typeof value === "boolean") {
    request.input(name, sql.Bit, value);
    return;
  }
  if (value instanceof Date) {
    request.input(name, sql.DateTime2, value);
    return;
  }
  request.input(
    name,
    sql.NVarChar(sql.MAX),
    value == null ? null : String(value),
  );
}

export async function query<T = unknown>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = await getPool();
  const request = pool.request();
  values.forEach((value, index) => bindValue(request, `p${index + 1}`, value));

  const result = await request.query<T>(normalizeSql(text));
  const rows = result.recordset ?? [];
  return {
    rows,
    rowCount:
      result.rowsAffected.reduce((sum, count) => sum + count, 0) || rows.length,
  };
}

export function asIso(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function describeDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Problema: errore database non classificato. Codice errore: DB-SCONOSCIUTO.";
  }

  const fields = error as {
    code?: unknown;
    number?: unknown;
    message?: unknown;
    originalError?: { code?: unknown; message?: unknown };
  };

  const code = String(fields.code ?? fields.originalError?.code ?? "");
  const message = String(fields.message ?? fields.originalError?.message ?? "");

  if (code === "ESOCKET") {
    return "Problema: SQL Server non raggiungibile. Verifica server/IP, porta TCP 1433, servizio SQL Server attivo e firewall Windows. Codice errore: DB-ESOCKET.";
  }
  if (code === "ELOGIN") {
    return "Problema: login SQL Server rifiutato. Verifica utente, password, database e modalità autenticazione SQL. Codice errore: DB-ELOGIN.";
  }
  if (code === "ETIMEOUT") {
    return "Problema: timeout verso SQL Server. La rete o il server non rispondono entro il tempo previsto. Codice errore: DB-ETIMEOUT.";
  }
  if (code === "ENOTOPEN") {
    return "Problema: connessione SQL Server non aperta. Riprova o riavvia il servizio applicativo. Codice errore: DB-ENOTOPEN.";
  }
  if (fields.number === 208) {
    return "Problema: tabella o vista SQL Server mancante. Verifica che lo schema del database sia stato applicato. Codice errore: DB-208.";
  }
  if (fields.number === 2812 || message.includes("verify_employee_pin")) {
    return "Problema: funzione dbo.verify_employee_pin mancante. Applica o aggiorna lo schema del database. Codice errore: DB-2812.";
  }

  const errorCode = code || String(fields.number ?? "GENERICO");
  return message
    ? `Problema: errore SQL Server. ${message}. Codice errore: DB-${errorCode}.`
    : `Problema: errore SQL Server. Codice errore: DB-${errorCode}.`;
}
