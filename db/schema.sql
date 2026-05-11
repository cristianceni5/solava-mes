CREATE TABLE dbo.operators (
  id uniqueidentifier NOT NULL CONSTRAINT df_operators_id DEFAULT newid(),
  matricola nvarchar(20) NOT NULL,
  pin_hash varbinary(32) NOT NULL,
  full_name nvarchar(120) NOT NULL,
  active bit NOT NULL CONSTRAINT df_operators_active DEFAULT 1,
  created_at datetime2(3) NOT NULL CONSTRAINT df_operators_created_at DEFAULT sysdatetime(),
  CONSTRAINT pk_operators PRIMARY KEY (id),
  CONSTRAINT uq_operators_matricola UNIQUE (matricola)
);

CREATE TABLE dbo.plc_events (
  id uniqueidentifier NOT NULL CONSTRAINT df_plc_events_id DEFAULT newid(),
  line_id nvarchar(20) NOT NULL,
  quantity int NOT NULL,
  label nvarchar(80) NOT NULL,
  dato_pronte bit NOT NULL,
  dato_letto bit NOT NULL,
  duplicate bit NOT NULL CONSTRAINT df_plc_events_duplicate DEFAULT 0,
  received_at datetime2(3) NOT NULL CONSTRAINT df_plc_events_received_at DEFAULT sysdatetime(),
  CONSTRAINT pk_plc_events PRIMARY KEY (id),
  CONSTRAINT ck_plc_events_line CHECK (line_id in ('mattoni', 'tegole')),
  CONSTRAINT ck_plc_events_quantity CHECK (quantity > 0)
);

CREATE INDEX ix_plc_events_line_received ON dbo.plc_events(line_id, received_at DESC);
CREATE INDEX ix_plc_events_dedupe ON dbo.plc_events(line_id, label, received_at DESC);

CREATE TABLE dbo.phase_receipts (
  id uniqueidentifier NOT NULL CONSTRAINT df_phase_receipts_id DEFAULT newid(),
  plc_event_id uniqueidentifier NOT NULL,
  line_id nvarchar(20) NOT NULL,
  phase_id nvarchar(30) NOT NULL,
  operator_id uniqueidentifier NOT NULL,
  quantity int NOT NULL,
  label nvarchar(80) NOT NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT df_phase_receipts_created_at DEFAULT sysdatetime(),
  CONSTRAINT pk_phase_receipts PRIMARY KEY (id),
  CONSTRAINT fk_phase_receipts_event FOREIGN KEY (plc_event_id) REFERENCES dbo.plc_events(id),
  CONSTRAINT fk_phase_receipts_operator FOREIGN KEY (operator_id) REFERENCES dbo.operators(id),
  CONSTRAINT uq_phase_receipts_once UNIQUE (plc_event_id, phase_id),
  CONSTRAINT ck_phase_receipts_line CHECK (line_id in ('mattoni', 'tegole')),
  CONSTRAINT ck_phase_receipts_phase CHECK (
    phase_id in ('verde', 'qc-verde', 'secco', 'qc-secco', 'cotto', 'qc-cotto', 'imballaggio', 'fine')
  )
);

CREATE INDEX ix_phase_receipts_phase_created ON dbo.phase_receipts(phase_id, created_at DESC);

CREATE TABLE dbo.print_jobs (
  id uniqueidentifier NOT NULL CONSTRAINT df_print_jobs_id DEFAULT newid(),
  plc_event_id uniqueidentifier NOT NULL,
  line_id nvarchar(20) NOT NULL,
  label nvarchar(80) NOT NULL,
  quantity int NOT NULL,
  printer_name nvarchar(120) NOT NULL,
  status nvarchar(20) NOT NULL CONSTRAINT df_print_jobs_status DEFAULT 'pending',
  attempts int NOT NULL CONSTRAINT df_print_jobs_attempts DEFAULT 0,
  max_attempts int NOT NULL CONSTRAINT df_print_jobs_max_attempts DEFAULT 5,
  error_code nvarchar(80) NULL,
  error_message nvarchar(1000) NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT df_print_jobs_created_at DEFAULT sysdatetime(),
  updated_at datetime2(3) NOT NULL CONSTRAINT df_print_jobs_updated_at DEFAULT sysdatetime(),
  CONSTRAINT pk_print_jobs PRIMARY KEY (id),
  CONSTRAINT fk_print_jobs_event FOREIGN KEY (plc_event_id) REFERENCES dbo.plc_events(id),
  CONSTRAINT ck_print_jobs_line CHECK (line_id in ('mattoni', 'tegole')),
  CONSTRAINT ck_print_jobs_status CHECK (status in ('pending', 'printing', 'printed', 'failed'))
);

CREATE INDEX ix_print_jobs_pickup ON dbo.print_jobs(status, created_at);

INSERT INTO dbo.operators (matricola, pin_hash, full_name) VALUES
  ('1001', hashbytes('SHA2_256', '1001:1234'), 'Operatore Verde'),
  ('1002', hashbytes('SHA2_256', '1002:2345'), 'Operatore Secco'),
  ('1003', hashbytes('SHA2_256', '1003:3456'), 'Operatore Cotto'),
  ('9999', hashbytes('SHA2_256', '9999:0000'), 'Responsabile Turno');

GO

CREATE OR ALTER FUNCTION dbo.verify_operator_pin(
  @matricola nvarchar(20),
  @pin nvarchar(10)
)
RETURNS TABLE
AS
RETURN
  SELECT id, matricola, full_name
  FROM dbo.operators
  WHERE matricola = @matricola
    AND active = 1
    AND pin_hash = hashbytes('SHA2_256', @matricola + ':' + @pin);
