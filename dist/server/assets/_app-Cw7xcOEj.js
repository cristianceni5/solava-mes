import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, useRouterState, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, PackagePlus, Truck, Printer, History, Users, LogOut, Factory } from "lucide-react";
import { u as useAuth } from "./auth-N2sa7GQg.js";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/versamento", label: "Versamento", icon: PackagePlus },
  { to: "/spedizioni", label: "Spedizioni", icon: Truck },
  { to: "/stampe", label: "Coda stampa", icon: Printer },
  { to: "/storico", label: "Storico", icon: History },
  { to: "/anagrafica", label: "Anagrafica", icon: Users }
];
function MesLayout() {
  const { employee, ready, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    if (ready && !employee) navigate({ to: "/login" });
  }, [ready, employee, navigate]);
  if (!ready || !employee) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background text-muted-foreground", children: "Caricamento..." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs("aside", { className: "hidden w-72 shrink-0 flex-col border-r border-border bg-card md:flex", children: [
      /* @__PURE__ */ jsxs("div", { className: "border-b border-border px-5 py-5", children: [
        /* @__PURE__ */ jsx("img", { src: "/brand/solava-logo.svg", alt: "SOLAVA", className: "h-12 w-auto" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase", children: [
          "MES Produzione · ",
          employee.phase_name
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-1 p-3", children: nav.map((item) => {
        const active = path === item.to;
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: item.to,
            className: cn(
              "flex items-center gap-3 rounded-md px-3 py-3 text-base font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            ),
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }),
              item.label
            ]
          },
          item.to
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-border p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: employee.full_name }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Mat. ",
            employee.matricola,
            " · ",
            employee.phase_name
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              logout();
              navigate({ to: "/login" });
            },
            className: "flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
            children: [
              /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
              " Esci"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between border-b border-border bg-card px-6 py-3 md:hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Factory, { className: "h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsx("img", { src: "/brand/solava-logo.svg", alt: "SOLAVA", className: "h-8 w-auto" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              logout();
              navigate({ to: "/login" });
            },
            className: "text-sm text-muted-foreground",
            children: "Esci"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden", children: nav.map((item) => {
        const active = path === item.to;
        return /* @__PURE__ */ jsx(
          Link,
          {
            to: item.to,
            className: cn(
              "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
              active ? "bg-primary text-primary-foreground" : "text-foreground/70"
            ),
            children: item.label
          },
          item.to
        );
      }) }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-auto p-6", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] });
}
const SplitComponent = MesLayout;
export {
  SplitComponent as component
};
