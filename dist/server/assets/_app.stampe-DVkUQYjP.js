import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn, e as getPrintQueue } from "./mes.functions-DoPQPgdP.js";
import { useQuery } from "@tanstack/react-query";
import { Clock, Printer, CheckCircle2, AlertTriangle } from "lucide-react";
import "react";
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
function CodaStampa() {
  const fetchQueue = useServerFn(getPrintQueue);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["print-queue"],
    queryFn: () => fetchQueue(),
    refetchInterval: 5e3
  });
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Coda stampa PLC" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Job generati automaticamente dagli endpoint PLC per Mattoni e Tegole" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3 text-primary" }),
        "Aggiornamento 5s"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Clock, label: "In coda", value: String(data?.kpi.pending ?? 0) }),
      /* @__PURE__ */ jsx(Stat, { icon: Printer, label: "In stampa", value: String(data?.kpi.printing ?? 0) }),
      /* @__PURE__ */ jsx(Stat, { icon: CheckCircle2, label: "Stampati", value: String(data?.kpi.printed ?? 0) }),
      /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: "Errori", value: String(data?.kpi.failed ?? 0) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left text-xs text-muted-foreground uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Data" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Linea" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Etichetta" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Quantità" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Stampante" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Stato" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        isLoading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "Caricamento..." }) }),
        (data?.jobs ?? []).map((job) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-muted-foreground", children: new Date(job.created_at).toLocaleString("it-IT") }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-semibold", children: job.line?.name ?? job.line_id }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-mono", children: job.label }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right font-semibold", children: job.quantity }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: job.printer_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 capitalize", children: job.status })
        ] }, job.id)),
        !isLoading && !data?.jobs.length && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: "Nessun job di stampa." }) })
      ] })
    ] }) })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-medium tracking-wide text-muted-foreground uppercase", children: label }),
      /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-primary" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-3xl font-bold tracking-tight", children: value })
  ] });
}
export {
  CodaStampa as component
};
