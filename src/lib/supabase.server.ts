import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;
let publicClient: SupabaseClient | undefined;

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;

    const viteEnv = (import.meta as unknown as { env?: Record<string, string> })
      .env;
    const viteValue = viteEnv?.[name];
    if (viteValue) return viteValue;
  }
  return undefined;
}

export function getSupabaseConfig() {
  return {
    url: envValue("SUPABASE_URL", "VITE_SUPABASE_URL"),
    publicKey: envValue(
      "SUPABASE_PUBLIC_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_PUBLIC_KEY",
      "VITE_SUPABASE_ANON_KEY",
    ),
    privateKey: envValue("SUPABASE_PRIVATE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function supabaseAdmin() {
  const { url, privateKey } = getSupabaseConfig();
  if (!url || !privateKey) {
    throw new Error(
      "Problema: Supabase non configurato. Codice errore: DB-CONFIG-MANCANTE. Imposta SUPABASE_URL e SUPABASE_PRIVATE_KEY.",
    );
  }

  adminClient ??= createClient(url, privateKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}

export function supabasePublic() {
  const { url, publicKey } = getSupabaseConfig();
  if (!url || !publicKey) {
    throw new Error(
      "Problema: Supabase public key non configurata. Codice errore: DB-PUBLIC-CONFIG-MANCANTE. Imposta SUPABASE_URL e SUPABASE_PUBLIC_KEY.",
    );
  }

  publicClient ??= createClient(url, publicKey);
  return publicClient;
}

export function describeSupabaseTarget() {
  const { url } = getSupabaseConfig();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return { host: parsed.host };
  } catch {
    return { host: url };
  }
}

export function describeDatabaseError(error: unknown) {
  if (error instanceof Error) {
    const cause =
      "cause" in error && error.cause instanceof Error
        ? ` Causa: ${error.cause.message}.`
        : "";
    return `Problema: errore Supabase. ${error.message}.${cause} Codice errore: DB-GENERICO.`;
  }

  if (!error || typeof error !== "object") {
    return "Problema: errore database non classificato. Codice errore: DB-SCONOSCIUTO.";
  }

  const fields = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    cause?: unknown;
  };

  const code = String(fields.code ?? "GENERICO");
  const message = String(fields.message ?? "");
  const details = String(fields.details ?? "");
  const hint = String(fields.hint ?? "");
  const cause =
    fields.cause instanceof Error
      ? fields.cause.message
      : typeof fields.cause === "string"
        ? fields.cause
        : "";

  if (
    message.includes("fetch failed") ||
    cause.includes("getaddrinfo") ||
    cause.includes("ENOTFOUND")
  ) {
    return "Problema: Supabase non raggiungibile. Verifica SUPABASE_URL, DNS/rete e riavvia il dev server dopo le modifiche al file .env. Codice errore: DB-RETE.";
  }

  if (code === "PGRST116") {
    return "Problema: record Supabase non trovato. Codice errore: DB-PGRST116.";
  }
  if (code === "PGRST202") {
    const detail = [message, details, hint].filter(Boolean).join(" ");
    return detail
      ? `Problema: funzione RPC Supabase mancante o schema cache non aggiornata. Dettaglio Supabase: ${detail}. Codice errore: DB-PGRST202.`
      : "Problema: funzione RPC Supabase mancante o schema cache non aggiornata. Esegui db/schema.sql nel SQL Editor e poi ricarica la schema cache Supabase. Codice errore: DB-PGRST202.";
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
  return suffix
    ? `Problema: errore Supabase. ${suffix}. Codice errore: DB-${code}.`
    : `Problema: errore Supabase. Codice errore: DB-${code}.`;
}

export function unwrap<T>(result: { data: T | null; error: unknown }) {
  if (result.error) throw result.error;
  return result.data as T;
}
