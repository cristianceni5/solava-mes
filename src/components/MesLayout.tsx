import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Factory,
  History,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Printer,
  Truck,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/versamento", label: "Versamento", icon: PackagePlus },
  { to: "/spedizioni", label: "Spedizioni", icon: Truck },
  { to: "/stampe", label: "Coda stampa", icon: Printer },
  { to: "/storico", label: "Storico", icon: History },
  { to: "/anagrafica", label: "Anagrafica", icon: Users },
];

export function MesLayout() {
  const { employee, ready, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (ready && !employee) navigate({ to: "/login" });
  }, [ready, employee, navigate]);

  if (!ready || !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Caricamento...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-4 py-4">
          <img src="/brand/solava-logo.svg" alt="SOLAVA" className="h-8 w-auto" />
          <div className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            MES Produzione · {employee.phase_name}
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold">{employee.full_name}</div>
            <div className="text-xs text-muted-foreground">
              Mat. {employee.matricola} · {employee.phase_name}
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Esci
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <Factory className="h-5 w-5 text-primary" />
            <img src="/brand/solava-logo.svg" alt="SOLAVA" className="h-8 w-auto" />
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="text-sm text-muted-foreground"
          >
            Esci
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {nav.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "text-foreground/70",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
