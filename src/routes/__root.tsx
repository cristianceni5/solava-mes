import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Problema: pagina non trovata
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          L'indirizzo aperto non esiste oppure la pagina è stata spostata.
          Controlla il menu laterale o torna alla dashboard.
        </p>
        <div className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">
          Codice errore:{" "}
          <span className="font-mono font-semibold">MES-404-PAGINA</span>
        </div>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Torna alla dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Problema: impossibile caricare la pagina
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Si è verificato un errore interno del MES. Riprova ad aggiornare la
          pagina; se il problema resta, comunica il codice errore.
        </p>
        <div className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">
          Codice errore:{" "}
          <span className="font-mono font-semibold">MES-500-PAGINA</span>
        </div>
        <details className="mt-3 rounded-md border border-border bg-card text-left">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-muted-foreground">
            Dettagli tecnici
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-border p-3 text-xs">
            {error.message || "Errore non classificato"}
          </pre>
        </details>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Riprova
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Torna alla dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "SO.LA.VA MES — Produzione laterizi" },
        {
          name: "description",
          content:
            "Sistema MES SO.LA.VA per registrare la produzione di mattoni, tegole e laterizi e dialogare con i PLC di linea.",
        },
        { name: "author", content: "SO.LA.VA" },
        { property: "og:title", content: "SO.LA.VA MES" },
        {
          property: "og:description",
          content: "Dashboard MES per la produzione di laterizi.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:site", content: "@Lovable" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
