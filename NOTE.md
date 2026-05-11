# SOLAVA MES — Note di Progetto

> Documento di lavoro aggiornato progressivamente. Tiene traccia dell'architettura attuale, delle decisioni tecniche, dei requisiti GDPR e della roadmap di sviluppo.

---

## 1. Contesto — Sistema attuale (TeamSystem / PowerMES)

### Architettura esistente

```
PLC Siemens S7-1200/1500
        ↓
    PowerMES (TeamSystem)
        ↓
  SQL Server (backend)
        ↓
  Frontend client sui PC dei reparti
```

### Componenti

| Componente    | Dettaglio                                                |
| ------------- | -------------------------------------------------------- |
| Fornitore     | TeamSystem (SOLAVA gestionale)                           |
| Frontend      | Client installato sui PC dei vari reparti                |
| Backend       | Server SQL centralizzato                                 |
| MES           | PowerMES (TeamSystem) — middleware tra PLC e DB          |
| PLC           | Siemens S7-1200 e S7-1500                                |
| DB            | SQL Server — contiene ricettario, versamenti, dipendenti |
| Comunicazione | Live magazzino ↔ DB ↔ monitor                            |

### Problemi noti

- Magazzino non funzionante, tracciamento pacchi assente
- Prodotti in uscita dalla catena persi o mal contati
- Assistenza TeamSystem praticamente inesistente
- Costi licenze elevati a fronte di qualità scarsa
- Poca conoscenza interna del codice da parte della software house
- Nessuna garanzia di conformità GDPR lato configurazione on-premise

---

## 2. Nuovo sistema — solava-mes

### Repository

`https://github.com/cristianceni5/solava-mes`

### Stack tecnico

| Tecnologia            | Ruolo                                        |
| --------------------- | -------------------------------------------- |
| React 19 + TypeScript | Frontend                                     |
| TanStack Start        | Framework full-stack (SSR + API server-side) |
| TanStack Router       | Routing file-based type-safe                 |
| TanStack Query        | Data fetching e cache                        |
| Vite 7                | Bundler                                      |
| Tailwind CSS v4       | Styling                                      |
| Shadcn/ui + Radix UI  | Componenti UI                                |
| `mssql`               | Connessione diretta a SQL Server             |
| Zod + React Hook Form | Validazione form                             |
| Recharts              | Grafici e KPI                                |

### Design System

Documentato in `DESIGN_SYSTEM.md`. Componenti riusabili in `src/components/mes-ui.tsx`:

- `PageShell` — wrapper standard pagine
- `PageHeader` — intestazione senza icone
- `Surface` — card/superficie principale
- `TableSurface` — contenitore tabelle scrollabili
- `StatCard` — KPI numerici
- `StatusPill` — badge di stato

### Cosa esiste già

- Coda di stampa connessa a un PLC sulla **porta 8031** — punto di riferimento per la comunicazione browser ↔ PLC
- Connessione `mssql` al SQL Server già presente nel progetto

### Cose da sistemare nel repo

- [ ] Aggiungere `node_modules/` e `dist/` al `.gitignore`
- [ ] Rinominare `nigga.ts` con un nome descrittivo e spostarlo in `src/`

---

## 3. Architettura target

```
PLC Siemens S7-1200/1500
        ↓ (OPC UA / S7 nativo — da verificare in TIA Portal)
   Backend Node.js (TanStack Start)
        ↓
   SQL Server (nostro DB custom)
        ↓
  React Frontend (browser — tutti i reparti)
```

**PowerMES viene rimosso completamente.** Il backend custom prende il suo posto direttamente.

### Protocollo PLC — da verificare in azienda

Aprire TIA Portal e controllare le connessioni attive del PLC per determinare il protocollo in uso:

- **OPC UA** — preferito, già integrato nei S7-1500, disponibile sui S7-1200 con firmware recente
- **S7 nativo su TCP** — alternativa, librerie `nodes7` o `snap7`
- **MQTT** — opzione broker nel mezzo, ottimo per eventi real-time

In alternativa: sniff di rete con **Wireshark** tra PowerMES e PLC per vedere protocollo e porta.

---

## 4. GDPR e Sicurezza

### Perché è rilevante

Il DB contiene dati dei dipendenti. Ogni operazione che lega un'azione (aggiunta/rimozione pacco, versamento) a una persona fisica è dato personale. Il titolare del trattamento è SOLAVA — non TeamSystem, che si è coperta col DPA contrattuale.

### Base giuridica

Per un sistema interno tra dipendenti: **legittimo interesse / contratto di lavoro**. Non serve il consenso esplicito per loggare le operazioni — basta informare i dipendenti nell'informativa aziendale.

### Misure da implementare

#### Autenticazione

- [ ] Login individuale per ogni operatore (niente credenziali condivise)
- [ ] Ruoli: `operatore`, `magazziniere`, `admin`
- [ ] JWT + refresh token lato TanStack Start
- [ ] 2FA per ruoli admin almeno

#### Audit Log immutabile

Tabella append-only — nessuna UPDATE o DELETE:

```sql
CREATE TABLE log_operazioni (
  id          BIGINT IDENTITY PRIMARY KEY,
  utente_id   INT NOT NULL,
  azione      VARCHAR(50) NOT NULL,   -- 'AGGIUNTA_PACCO', 'RIMOZIONE', ecc.
  entita      VARCHAR(50),            -- 'magazzino', 'versamento', ecc.
  entita_id   INT,
  payload     NVARCHAR(MAX),          -- JSON con i dettagli
  ip          VARCHAR(45),
  ts          DATETIME2 DEFAULT GETDATE()
);
```

- [ ] Creare la tabella nel DB
- [ ] Ogni operazione sul magazzino scrive su questa tabella
- [ ] Nessun endpoint che permetta DELETE su questa tabella

#### Comunicazione

- [ ] HTTPS ovunque, anche in LAN locale
- [ ] OPC UA in modalità `SignAndEncrypt` (non `None`)
- [ ] Accesso al DB solo dal backend — mai connessioni dirette dal frontend

#### Data minimization e retention

- [ ] Nei log salvare solo `utente_id`, non nome/cognome in chiaro
- [ ] Definire policy di retention (es. anonimizzazione dopo 2 anni)
- [ ] Procedura di anonimizzazione automatica oltre la soglia

---

## 5. Schema DB — struttura di partenza

Da creare nel Docker locale per sviluppo. Da raffinare con la struttura reale del DB TeamSystem.

```sql
-- Utenti e ruoli
CREATE TABLE utenti (
  id         INT IDENTITY PRIMARY KEY,
  matricola  VARCHAR(20) UNIQUE NOT NULL,
  nome       NVARCHAR(100),
  ruolo      VARCHAR(20) NOT NULL,  -- 'operatore', 'magazziniere', 'admin'
  attivo     BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Ricettario materiali
CREATE TABLE ricette (
  id          INT IDENTITY PRIMARY KEY,
  codice      VARCHAR(50) UNIQUE NOT NULL,
  descrizione NVARCHAR(200),
  tipo        VARCHAR(20),  -- 'imballo', 'lavorazione'
  payload     NVARCHAR(MAX),  -- JSON con i dati specifici della ricetta
  updated_at  DATETIME2 DEFAULT GETDATE()
);

-- Magazzino
CREATE TABLE magazzino (
  id          INT IDENTITY PRIMARY KEY,
  codice_pacco VARCHAR(100) UNIQUE NOT NULL,
  ricetta_id  INT REFERENCES ricette(id),
  stato       VARCHAR(20),  -- 'in_stock', 'uscito', 'in_lavorazione'
  created_at  DATETIME2 DEFAULT GETDATE(),
  updated_at  DATETIME2 DEFAULT GETDATE()
);

-- Versamenti
CREATE TABLE versamenti (
  id          INT IDENTITY PRIMARY KEY,
  utente_id   INT REFERENCES utenti(id),
  ricetta_id  INT REFERENCES ricette(id),
  quantita    DECIMAL(10,3),
  ts          DATETIME2 DEFAULT GETDATE()
);

-- Audit log (append-only)
CREATE TABLE log_operazioni (
  id          BIGINT IDENTITY PRIMARY KEY,
  utente_id   INT,
  azione      VARCHAR(50) NOT NULL,
  entita      VARCHAR(50),
  entita_id   INT,
  payload     NVARCHAR(MAX),
  ip          VARCHAR(45),
  ts          DATETIME2 DEFAULT GETDATE()
);
```

---

## 6. Ambiente di sviluppo da casa

### Installazioni necessarie

| Tool                        | Scopo                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| Node.js LTS (v22)           | Runtime                                                          |
| VS Code                     | Editor — con ESLint, Prettier, Tailwind IntelliSense, TypeScript |
| Git                         | Versioning                                                       |
| Docker Desktop              | SQL Server locale                                                |
| Azure Data Studio o DBeaver | Esplora e interroga il DB locale                                 |
| Snap7 Server                | Emulatore PLC S7 per test locali                                 |
| Node-RED (opzionale)        | Simulazione flussi dati PLC / mock eventi                        |

### SQL Server locale con Docker

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=TuaPassword123!" \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
```

### Strategia sviluppo da casa

1. Usare **dati mock** (JSON statici) per sviluppare le schermate e le route
2. Caricare lo schema SQL su Docker e sviluppare le API server-side con `mssql`
3. Quando si è in azienda, sostituire il mock con le chiamate reali al DB e al PLC

---

## 7. Roadmap

### Fase 1 — Fondamenta (da casa)

- [ ] Pulire il repo (`.gitignore`, rinominare file)
- [ ] Tirare su SQL Server su Docker con lo schema di partenza
- [ ] Implementare autenticazione JWT con ruoli
- [ ] Strutturare la cartella `db/` con query organizzate per dominio
- [ ] Schermate base: login, dashboard, magazzino (con dati mock)

### Fase 2 — Connessione (in azienda)

- [ ] Verificare protocollo PLC in TIA Portal (OPC UA / S7 / altro)
- [ ] Connettere il backend al DB SQL Server reale
- [ ] Sostituire PowerMES con la connessione diretta backend ↔ PLC
- [ ] Testare tracciamento pacchi e conteggio prodotti end-to-end

### Fase 3 — Produzione

- [ ] HTTPS su tutta la rete locale
- [ ] OPC UA in modalità `SignAndEncrypt`
- [ ] Audit log completo su tutte le operazioni
- [ ] Test di retention e anonimizzazione dei log
- [ ] Formazione operatori sul nuovo sistema
- [ ] Migrazione dati storici (ricette, dipendenti) dal DB TeamSystem

---

> **Nota:** questo documento va aggiornato a ogni decisione tecnica rilevante o cambio di requisiti.
