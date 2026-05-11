import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn, a as getPhaseWorkstation, c as confirmPhaseReceipt } from "./mes.functions-DoPQPgdP.js";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PackageCheck, Clock, Printer, CheckCircle2 } from "lucide-react";
import { u as useAuth } from "./auth-N2sa7GQg.js";
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
function WorkstationPage() {
  const {
    employee
  } = useAuth();
  const qc = useQueryClient();
  const fetchWorkstation = useServerFn(getPhaseWorkstation);
  const confirmReceipt = useServerFn(confirmPhaseReceipt);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["workstation", employee?.phase_id],
    queryFn: () => fetchWorkstation({
      data: {
        phase_id: employee.phase_id
      }
    }),
    enabled: !!employee,
    refetchInterval: 2e3
  });
  async function onConfirm(line) {
    if (!employee || !line.latestEvent) return;
    const res = await confirmReceipt({
      data: {
        employee_id: employee.id,
        phase_id: employee.phase_id,
        line_id: line.id,
        plc_event_id: line.latestEvent.id
      }
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Versamento registrato · ${line.name}`);
    qc.invalidateQueries({
      queryKey: ["workstation", employee.phase_id]
    });
  }
  const lines = data?.lines ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("section", { className: "rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-base font-black tracking-wide text-primary uppercase", children: "Postazione" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-1 text-5xl font-black tracking-tight", children: employee?.phase_name ?? data?.phase?.name })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-md bg-muted px-5 py-3 text-xl font-bold", children: "Aggiornamento PLC ogni 2s" })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-6 xl:grid-cols-2", children: lines.map((line) => /* @__PURE__ */ jsx(LineCard, { line, busy: isLoading, onConfirm: () => onConfirm(line) }, line.id)) }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 text-2xl font-black", children: "Ultimi versamenti della fase" }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4", children: [
        (data?.recentReceipts ?? []).map((receipt) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-background p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-lg font-black", children: receipt.line?.name }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 font-mono text-base", children: receipt.label }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-2xl font-black text-primary", children: [
            receipt.quantity.toLocaleString("it-IT"),
            " pz"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: new Date(receipt.created_at).toLocaleString("it-IT") })
        ] }, receipt.id)),
        !data?.recentReceipts?.length && /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold text-muted-foreground", children: "Nessun versamento registrato in questa fase." })
      ] })
    ] })
  ] });
}
function LineCard({
  line,
  busy,
  onConfirm
}) {
  const canConfirm = !!line.latestEvent && !line.receipt;
  return /* @__PURE__ */ jsxs("section", { className: "rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black", children: line.name }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xl font-semibold text-muted-foreground", children: [
          "Uscita ",
          line.output
        ] })
      ] }),
      /* @__PURE__ */ jsx(HandshakeBadge, { ready: line.handshake.datoPronte, read: line.handshake.datoLetto })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Panel, { icon: PackageCheck, label: "Quantità PLC", children: line.latestEvent ? `${line.latestEvent.quantity.toLocaleString("it-IT")} pz` : "-" }),
      /* @__PURE__ */ jsx(Panel, { icon: Clock, label: "Etichetta lotto", children: line.latestEvent?.label ?? "-" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-md border border-border bg-background p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2 text-lg font-black", children: [
        /* @__PURE__ */ jsx(Printer, { className: "h-6 w-6 text-primary" }),
        "Stampante dedicata"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-black", children: line.printer }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 text-lg text-muted-foreground", children: [
        "Stato job: ",
        line.printJob ? printStatusLabel(line.printJob.status) : "nessun job"
      ] }),
      line.printJob?.error_message && /* @__PURE__ */ jsxs("div", { className: "mt-2 rounded-md bg-destructive/10 p-3 text-base font-semibold text-destructive", children: [
        line.printJob.error_code ?? "ERRORE",
        " · ",
        line.printJob.error_message
      ] })
    ] }),
    /* @__PURE__ */ jsxs("button", { type: "button", disabled: !canConfirm || busy, onClick: onConfirm, className: canConfirm ? "mt-6 flex h-24 w-full items-center justify-center gap-3 rounded-md bg-primary text-3xl font-black text-primary-foreground shadow" : "mt-6 flex h-24 w-full items-center justify-center gap-3 rounded-md bg-muted text-3xl font-black text-muted-foreground", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "h-9 w-9" }),
      line.receipt ? "VERSATO" : "VERSA ALLA FASE"
    ] })
  ] });
}
function Panel({
  icon: Icon,
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-background p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2 text-lg font-black text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6 text-primary" }),
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: "min-h-10 break-words text-3xl font-black", children })
  ] });
}
function HandshakeBadge({
  ready,
  read
}) {
  const label = ready && read ? "Dato letto" : ready ? "Dato pronto" : "Reset";
  const cls = ready && read ? "bg-emerald-100 text-emerald-800" : ready ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground";
  return /* @__PURE__ */ jsx("div", { className: `rounded-md px-4 py-2 text-xl font-black ${cls}`, children: label });
}
function printStatusLabel(status) {
  if (status === "pending") return "in coda";
  if (status === "printing") return "in stampa";
  if (status === "printed") return "stampato";
  return "errore";
}
export {
  WorkstationPage as component
};
