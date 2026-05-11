# CODICI errore MES

Questo file è il registro operativo dei codici mostrati in UI, API e diagnostica.

Gravità usate:

- `Errore`: problema bloccante o dato non affidabile.
- `Avviso`: anomalia da controllare, non sempre bloccante.
- `OK`: controllo regolare o codice di conferma.

## Applicazione

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `MES-404-PAGINA` | Errore | Pagina non trovata. | Controllare percorso, menu laterale o tornare alla dashboard. |
| `MES-500-PAGINA` | Errore | Errore durante caricamento/rendering pagina. | Riprova e comunica codice e dettagli tecnici. |
| `MES-500-SERVER` | Errore | Errore interno intercettato dal server MES. | Controllare log server e ultimo errore catturato. |
| `MES-SERVER-OK` | OK | Processo MES attivo e diagnostica raggiungibile. | Nessuna azione richiesta. |

## Rete Browser

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `MES-RETE-LOGIN` | Errore | Login non inviato al server. | Verificare rete, servizio MES e raggiungibilità server. |
| `MES-RETE-VERSAMENTO` | Errore | Versamento non salvato per problema comunicazione server. | Verificare rete/MES e ripetere il versamento dopo il controllo. |

## Database

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `DB-OK` | OK | SQL Server raggiungibile. | Nessuna azione richiesta. |
| `DB-CONFIG-MANCANTE` | Errore | Stringa SQL Server non configurata. | Configurare `SQLSERVER_CONNECTION_STRING` e riavviare il MES. |
| `DB-ESOCKET` | Errore | SQL Server non raggiungibile. | Controllare servizio, IP/nome server, porta TCP 1433, rete e firewall. |
| `DB-ELOGIN` | Errore | Login SQL Server rifiutato. | Verificare utente, password, database, permessi e autenticazione SQL. |
| `DB-ETIMEOUT` | Errore | Timeout verso SQL Server. | Controllare rete, carico SQL Server e firewall. |
| `DB-ENOTOPEN` | Errore | Connessione SQL non aperta. | Riprova o riavviare il servizio applicativo. |
| `DB-208` | Errore | Tabella o vista SQL mancante. | Applicare o verificare `db/schema.sql`. |
| `DB-2812` | Errore | Funzione `dbo.verify_employee_pin` mancante. | Applicare o aggiornare lo schema database. |
| `DB-SCONOSCIUTO` | Errore | Errore database non classificato. | Controllare log server e messaggio originale. |
| `DB-GENERICO` | Errore | SQL Server ha restituito un codice non mappato. | Annotare il codice `DB-*` mostrato e aggiornare questo registro. |

## PLC e API linea

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `PLC-LINEA-404` | Errore | Linea PLC non trovata. | Controllare URL `/api/plc/{linea}` e configurazione linee. |
| `PLC-METODO-NON-CONSENTITO` | Errore | Metodo HTTP non consentito. | Usare `POST` verso endpoint PLC. |
| `PLC-JSON-NON-VALIDO` | Errore | Payload PLC non è JSON valido. | Verificare formato e content type richiesta. |
| `PLC-QUANTITA-NON-VALIDA` | Errore | Quantità mancante, non intera o non positiva. | Inviare quantità intera maggiore di zero. |
| `PLC-ETICHETTA-MANCANTE` | Errore | Etichetta mancante o non valida. | Inviare etichetta come stringa non vuota. |
| `PLC-NESSUN-DATO` | Errore | Nessun evento PLC ricevuto per la linea. | Controllare endpoint, rete macchina e invio payload. |
| `PLC-HANDSHAKE` | Avviso | Evento presente ma handshake incompleto. | Verificare sequenza `DatoPronte` / `DatoLetto` e reset PLC. |
| `PLC-DUPLICATO` | Avviso | Evento PLC duplicato nella finestra deduplica. | Verificare reinvio etichetta senza reset o cambio dato. |
| `PLC-DUPLICATI-OK` | OK | Nessun duplicato PLC rilevato. | Nessuna azione richiesta. |

## Stampa

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `STAMPA-FALLITA` | Errore | Uno o più job di stampa sono falliti. | Controllare stampante, coda Windows, consumabili e rete. |
| `STAMPA-OK` | OK | Nessuna stampa fallita. | Nessuna azione richiesta. |
| `STAMPA-CODA-ALTA` | Avviso | Coda stampa oltre soglia. | Verificare velocità stampante e servizio che consuma la coda. |
| `STAMPA-CODA-OK` | OK | Coda stampa sotto soglia. | Nessuna azione richiesta. |

## Magazzino

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `MAGAZZINO-PACCO-ANOMALO` | Errore | Uno o più pacchi sono marcati come anomalia. | Aprire Magazzino e verificare stato, posizione ed etichetta. |
| `MAGAZZINO-OK` | OK | Nessun pacco in anomalia. | Nessuna azione richiesta. |
| `MAGAZZINO-TRACCIAMENTO-OK` | OK | Pacchi presenti nel tracciamento. | Nessuna azione richiesta. |
| `MAGAZZINO-NESSUN-PACCO` | Avviso | Nessun pacco tracciato. | Verificare ricezione PLC o inviare evento di test. |

## Log e audit

| Codice | Gravità | Significato | Azione |
| --- | --- | --- | --- |
| `AUDIT-OK` | OK | Audit applicativo presente. | Nessuna azione richiesta. |
| `AUDIT-VUOTO` | Avviso | Nessuna operazione audit registrata. | Eseguire login o movimento pacco e controllare i log. |

## Regola di manutenzione

Quando un nuovo codice viene mostrato in UI, restituito da API o inserito in log, va aggiunto anche qui e in `src/lib/diagnostic-error-codes.ts`.
