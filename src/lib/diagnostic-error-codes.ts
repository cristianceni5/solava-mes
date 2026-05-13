export type DiagnosticErrorSeverity = "error" | "warning" | "ok";

export type DiagnosticErrorCode = {
  code: string;
  severity: DiagnosticErrorSeverity;
  area: string;
  problem: string;
  meaning: string;
  suggestedAction: string;
};

export const diagnosticErrorCodes: DiagnosticErrorCode[] = [
  {
    code: "MES-404-PAGINA",
    severity: "error",
    area: "Applicazione",
    problem: "Pagina non trovata",
    meaning: "L'indirizzo aperto non esiste oppure la pagina è stata spostata.",
    suggestedAction:
      "Controlla il percorso, usa il menu laterale o torna alla dashboard.",
  },
  {
    code: "MES-500-PAGINA",
    severity: "error",
    area: "Applicazione",
    problem: "Errore pagina React",
    meaning: "La pagina si è interrotta durante il caricamento o il rendering.",
    suggestedAction:
      "Riprova e comunica il codice errore con i dettagli tecnici.",
  },
  {
    code: "MES-500-SERVER",
    severity: "error",
    area: "Applicazione",
    problem: "Errore server MES",
    meaning: "Il server ha intercettato un errore interno durante la risposta.",
    suggestedAction:
      "Riprova, poi controlla log server e ultimo errore catturato.",
  },
  {
    code: "MES-RETE-LOGIN",
    severity: "error",
    area: "Rete",
    problem: "Login non inviato al server",
    meaning:
      "Il browser non riesce a comunicare con il server durante il login.",
    suggestedAction:
      "Verifica rete, servizio MES attivo e raggiungibilità del server.",
  },
  {
    code: "MES-RETE-VERSAMENTO",
    severity: "error",
    area: "Rete",
    problem: "Versamento non salvato",
    meaning:
      "Il browser non riesce a comunicare con il server durante il versamento.",
    suggestedAction:
      "Verifica rete, servizio MES e ripeti il versamento dopo il controllo.",
  },
  {
    code: "DB-OK",
    severity: "ok",
    area: "Database",
    problem: "Connessione Supabase regolare",
    meaning: "Il database è raggiungibile e risponde al controllo diagnostico.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "DB-CONFIG-MANCANTE",
    severity: "error",
    area: "Database",
    problem: "Connessione Supabase non configurata",
    meaning: "Il MES non ha URL o private key Supabase validi.",
    suggestedAction:
      "Configura SUPABASE_URL e SUPABASE_PRIVATE_KEY e riavvia il servizio MES.",
  },
  {
    code: "DB-ESOCKET",
    severity: "error",
    area: "Database",
    problem: "Supabase non raggiungibile",
    meaning:
      "Il server database non risponde o la rete non consente il collegamento.",
    suggestedAction:
      "Controlla URL Supabase, rete, DNS e disponibilita del progetto.",
  },
  {
    code: "DB-RETE",
    severity: "error",
    area: "Database",
    problem: "Supabase non raggiungibile",
    meaning:
      "Il server MES non riesce a risolvere o contattare l'URL Supabase configurato.",
    suggestedAction:
      "Verifica SUPABASE_URL, DNS/rete e riavvia il dev server dopo le modifiche al file .env.",
  },
  {
    code: "DB-ELOGIN",
    severity: "error",
    area: "Database",
    problem: "Login Supabase rifiutato",
    meaning: "Supabase ha rifiutato chiave, permessi o policy database.",
    suggestedAction:
      "Verifica SUPABASE_PRIVATE_KEY, service role e policy RLS.",
  },
  {
    code: "DB-ETIMEOUT",
    severity: "error",
    area: "Database",
    problem: "Timeout Supabase",
    meaning: "La rete o il server non rispondono entro il tempo previsto.",
    suggestedAction: "Controlla rete, stato progetto Supabase e firewall.",
  },
  {
    code: "DB-ENOTOPEN",
    severity: "error",
    area: "Database",
    problem: "Connessione database non aperta",
    meaning:
      "Il client database non ha una connessione pronta per eseguire la query.",
    suggestedAction: "Riprova o riavvia il servizio applicativo.",
  },
  {
    code: "DB-42P01",
    severity: "error",
    area: "Database",
    problem: "Tabella o vista mancante",
    meaning: "Una query usa un oggetto Supabase/Postgres che non esiste nello schema.",
    suggestedAction:
      "Verifica che db/schema.sql sia stato applicato al database.",
  },
  {
    code: "DB-SCHEMA-INCOMPLETO",
    severity: "error",
    area: "Database",
    problem: "Schema Supabase incompleto",
    meaning:
      "La funzione mes_schema_health ha trovato tabelle, colonne o funzioni mancanti.",
    suggestedAction:
      "Esegui tutto db/schema.sql nel SQL Editor di Supabase e ricontrolla il dettaglio missing.",
  },
  {
    code: "DB-PGRST116",
    severity: "error",
    area: "Database",
    problem: "Record database non trovato",
    meaning: "La richiesta si aspettava un record ma Supabase non lo ha trovato.",
    suggestedAction: "Verifica dati seed, ID inviati e relazioni.",
  },
  {
    code: "DB-PGRST202",
    severity: "error",
    area: "Database",
    problem: "Funzione RPC Supabase mancante",
    meaning:
      "PostgREST non trova una funzione richiesta, oppure la schema cache Supabase non e aggiornata.",
    suggestedAction:
      "Esegui tutto db/schema.sql nel SQL Editor di Supabase e poi ricarica la schema cache.",
  },
  {
    code: "DB-SCONOSCIUTO",
    severity: "error",
    area: "Database",
    problem: "Errore database non classificato",
    meaning:
      "L'errore ricevuto non contiene dettagli utili per una classificazione.",
    suggestedAction:
      "Controlla log server e messaggio originale dell'eccezione.",
  },
  {
    code: "DB-GENERICO",
    severity: "error",
    area: "Database",
    problem: "Errore Supabase generico",
    meaning: "Supabase ha risposto con un codice non ancora mappato nel MES.",
    suggestedAction:
      "Annota il codice DB-* mostrato e aggiorna questa legenda.",
  },
  {
    code: "PLC-LINEA-404",
    severity: "error",
    area: "PLC",
    problem: "Linea PLC non trovata",
    meaning: "La chiamata API punta a una linea non configurata nel MES.",
    suggestedAction: "Controlla URL /api/plc/{linea} e configurazione linee.",
  },
  {
    code: "PLC-METODO-NON-CONSENTITO",
    severity: "error",
    area: "PLC",
    problem: "Metodo HTTP non consentito",
    meaning: "L'endpoint PLC accetta solo richieste POST.",
    suggestedAction: "Configura il PLC o il client per inviare POST.",
  },
  {
    code: "PLC-JSON-NON-VALIDO",
    severity: "error",
    area: "PLC",
    problem: "Payload JSON non valido",
    meaning: "Il corpo della richiesta PLC non è JSON leggibile.",
    suggestedAction: "Verifica formato e content type della richiesta PLC.",
  },
  {
    code: "PLC-QUANTITA-NON-VALIDA",
    severity: "error",
    area: "PLC",
    problem: "Quantità PLC non valida",
    meaning: "La quantità manca, non è intera o non è positiva.",
    suggestedAction: "Invia quantità numerica intera maggiore di zero.",
  },
  {
    code: "PLC-ETICHETTA-MANCANTE",
    severity: "error",
    area: "PLC",
    problem: "Etichetta PLC mancante",
    meaning: "Il payload PLC non contiene una etichetta valida.",
    suggestedAction: "Invia etichetta come stringa non vuota.",
  },
  {
    code: "PLC-NESSUN-DATO",
    severity: "error",
    area: "PLC",
    problem: "Nessun dato PLC ricevuto",
    meaning: "La linea non ha ancora inviato eventi validi al MES.",
    suggestedAction:
      "Controlla endpoint HTTP, rete macchina e invio del payload dal PLC.",
  },
  {
    code: "PLC-HANDSHAKE",
    severity: "warning",
    area: "PLC",
    problem: "Handshake incompleto",
    meaning:
      "Il dato esiste, ma DatoPronte e DatoLetto non sono entrambi coerenti.",
    suggestedAction:
      "Verifica la sequenza DatoPronte/DatoLetto e il reset lato PLC.",
  },
  {
    code: "PLC-DUPLICATO",
    severity: "warning",
    area: "PLC",
    problem: "Evento PLC duplicato",
    meaning:
      "Il PLC ha reinviato la stessa etichetta nella finestra di deduplica.",
    suggestedAction: "Verifica che la linea non reinvii il dato senza reset.",
  },
  {
    code: "PLC-DUPLICATI-OK",
    severity: "ok",
    area: "PLC",
    problem: "Nessun duplicato PLC",
    meaning: "Il controllo deduplica non ha trovato eventi ripetuti.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "STAMPA-FALLITA",
    severity: "error",
    area: "Stampa",
    problem: "Stampa etichetta fallita",
    meaning: "Uno o più job di stampa sono finiti in errore.",
    suggestedAction: "Controlla stampante, coda Windows, consumabili e rete.",
  },
  {
    code: "STAMPA-OK",
    severity: "ok",
    area: "Stampa",
    problem: "Nessuna stampa fallita",
    meaning: "Non risultano job di stampa in errore.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "STAMPA-CODA-ALTA",
    severity: "warning",
    area: "Stampa",
    problem: "Coda stampa troppo alta",
    meaning:
      "Le etichette in attesa stanno crescendo oltre la soglia prevista.",
    suggestedAction:
      "Verifica velocità stampante e servizio che consuma la coda.",
  },
  {
    code: "STAMPA-CODA-OK",
    severity: "ok",
    area: "Stampa",
    problem: "Coda stampa regolare",
    meaning: "La coda stampa è sotto la soglia di attenzione.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "MAGAZZINO-PACCO-ANOMALO",
    severity: "error",
    area: "Magazzino",
    problem: "Pacco marcato come anomalia",
    meaning: "Uno o più pacchi hanno stato anomalo e richiedono controllo.",
    suggestedAction: "Apri Magazzino e verifica stato, posizione ed etichetta.",
  },
  {
    code: "MAGAZZINO-OK",
    severity: "ok",
    area: "Magazzino",
    problem: "Nessun pacco in anomalia",
    meaning: "Il controllo non ha trovato pacchi anomali.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "MAGAZZINO-TRACCIAMENTO-OK",
    severity: "ok",
    area: "Magazzino",
    problem: "Pacchi tracciati",
    meaning: "Il MES contiene pacchi nel tracciamento magazzino.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "MAGAZZINO-NESSUN-PACCO",
    severity: "warning",
    area: "Magazzino",
    problem: "Nessun pacco tracciato",
    meaning:
      "Non ci sono pacchi nel tracciamento, normale solo a sistema appena avviato.",
    suggestedAction:
      "Invia un evento PLC di test o verifica la ricezione dalla linea.",
  },
  {
    code: "AUDIT-OK",
    severity: "ok",
    area: "Log e audit",
    problem: "Audit presente",
    meaning: "Il sistema sta registrando operazioni applicative.",
    suggestedAction: "Nessuna azione richiesta.",
  },
  {
    code: "AUDIT-VUOTO",
    severity: "warning",
    area: "Log e audit",
    problem: "Nessun audit registrato",
    meaning: "Il sistema non ha ancora registrato operazioni applicative.",
    suggestedAction:
      "Esegui login o movimento pacco e verifica la comparsa dei log.",
  },
  {
    code: "MES-SERVER-OK",
    severity: "ok",
    area: "Applicazione",
    problem: "Server MES attivo",
    meaning: "Il processo applicativo risponde alla diagnostica.",
    suggestedAction: "Nessuna azione richiesta.",
  },
];
