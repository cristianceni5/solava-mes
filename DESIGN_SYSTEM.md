# SO.LA.VA MES Design System

Questo documento definisce le regole pratiche per mantenere coerenti le schermate del MES.

## Principi

- Interfaccia operativa, densa e leggibile: niente hero, decorazioni o gradienti nelle schermate applicative.
- Titoli puliti: non usare icone accanto a `h1` e `h2`.
- Componenti riusabili prima di nuove classi Tailwind ripetute.
- Radius contenuto: usare `rounded-md` per controlli e `rounded-xl` per superfici principali.
- Colori sempre tramite token CSS/Tailwind (`bg-card`, `text-muted-foreground`, `bg-primary`) invece di valori hardcoded.

## Token

I token sono definiti in `src/styles.css`.

- Sfondo pagina: `bg-background`
- Testo principale: `text-foreground`
- Superfici: `bg-card`, `border-border`, `shadow-[var(--shadow-card)]`
- Azione primaria: `bg-primary`, `text-primary-foreground`
- Testo secondario: `text-muted-foreground`
- Campi: `border-input`, `bg-background`, focus `focus:ring-ring`

## Componenti Applicativi

I componenti riusabili del MES vivono in `src/components/mes-ui.tsx`.

### `PageShell`

Wrapper standard per le pagine interne.

```tsx
<PageShell>...</PageShell>
```

Usa `max-w-7xl`, centratura e spaziatura verticale coerente.

### `PageHeader`

Intestazione pagina senza icone.

```tsx
<PageHeader
  title="Spedizioni"
  description="Etichette generate e coda controllata dal database locale"
/>
```

Usa `action` solo per controlli o badge di stato, non per decorazioni.

### `Surface`

Card/superficie principale.

```tsx
<Surface>
  <h2 className="mb-4 text-base font-semibold">Titolo sezione</h2>
  ...
</Surface>
```

### `TableSurface`

Contenitore standard per tabelle scrollabili.

```tsx
<TableSurface>
  <table className="w-full text-sm">...</table>
</TableSurface>
```

### Form

Usare sempre:

- `FormField` per label e controllo
- `TextInput` per input testuali/numerici
- `SelectInput` per select
- `PrimaryButton` per azioni principali

```tsx
<FormField label="Matricola">
  <TextInput
    value={matricola}
    onChange={(event) => setMatricola(event.target.value)}
  />
</FormField>
```

Per textarea usare `fieldControlClassName`.

```tsx
<textarea className={fieldControlClassName} />
```

### KPI e Stati

Usare `StatCard` per KPI numerici e `StatusPill` per piccoli stati di aggiornamento.

```tsx
<StatCard label="Stampati" value="12" />
<StatusPill>Aggiornamento 5s</StatusPill>
```

Le icone sono ammesse nei KPI o in indicatori tecnici, ma non nei titoli.

## Layout

- Pagine interne: `PageShell`.
- Header pagina: `PageHeader`.
- Griglie KPI: `grid gap-4 sm:grid-cols-*`.
- Form: `Surface` + `form` con `space-y-5`.
- Tabelle: `TableSurface`.

## Aggiungere Una Nuova Schermata

1. Crea la route in `src/routes`.
2. Importa i componenti da `@/components/mes-ui`.
3. Parti da `PageShell` e `PageHeader`.
4. Usa `Surface` per sezioni e form.
5. Usa `TableSurface` per tabelle.
6. Evita icone nei titoli e classi duplicate per input/card.

Esempio:

```tsx
return (
  <PageShell>
    <PageHeader
      title="Nuova schermata"
      description="Descrizione operativa breve"
    />
    <Surface>
      <form className="space-y-4">
        <FormField label="Campo">
          <TextInput />
        </FormField>
      </form>
    </Surface>
  </PageShell>
);
```
