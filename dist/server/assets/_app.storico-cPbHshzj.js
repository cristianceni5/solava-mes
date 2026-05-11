import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn, d as getDashboard } from "./mes.functions-DoPQPgdP.js";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { u as useAuth } from "./auth-N2sa7GQg.js";
import "@tanstack/react-router";
import "./server-DsZKktrW.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "../server.js";
function Storico() {
  const {
    employee
  } = useAuth();
  const fetchDash = useServerFn(getDashboard);
  const {
    data
  } = useQuery({
    queryKey: ["history", employee?.id],
    queryFn: () => fetchDash({
      data: {
        employee_id: employee.id
      }
    }),
    enabled: !!employee
  });
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const list = data?.recent ?? [];
    if (!q) return list;
    const token = q.toLowerCase();
    return list.filter((row) => row.products?.name?.toLowerCase().includes(token) || row.machines?.name?.toLowerCase().includes(token) || row.machines?.line?.toLowerCase().includes(token) || row.employees?.full_name?.toLowerCase().includes(token) || row.employees?.matricola?.toLowerCase().includes(token));
  }, [data, q]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Storico versamenti" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Ultimi 50 versamenti registrati" })
      ] }),
      /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Filtra per prodotto, linea, operatore...", className: "w-72 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left text-xs text-muted-foreground uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Data" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Operatore" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Prodotto" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Macchinario" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Qtà" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Scarti" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Turno" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.map((row) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 whitespace-nowrap text-muted-foreground", children: new Date(row.created_at).toLocaleString("it-IT") }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-2", children: [
            row.employees?.full_name,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "(",
              row.employees?.matricola,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: row.products?.name }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-2", children: [
            row.machines?.name,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "· ",
              row.machines?.line
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right font-semibold", children: row.quantity }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right text-destructive", children: row.scrap }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 capitalize", children: row.shift })
        ] }, row.id)),
        !rows.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "py-8 text-center text-muted-foreground", children: "Nessun versamento." }) })
      ] })
    ] }) })
  ] });
}
export {
  Storico as component
};
