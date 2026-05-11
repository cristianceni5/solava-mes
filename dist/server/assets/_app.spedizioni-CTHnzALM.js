import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn, f as getShipments, b as getCatalogs, h as createShipment } from "./mes.functions-DoPQPgdP.js";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Radio, Truck, Package, Plus } from "lucide-react";
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
function SpedizioniPage() {
  const {
    employee
  } = useAuth();
  const qc = useQueryClient();
  const fetchShipments = useServerFn(getShipments);
  const fetchCatalogs = useServerFn(getCatalogs);
  const submitShipment = useServerFn(createShipment);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetchShipments(),
    refetchInterval: 3e4
  });
  const {
    data: catalogs
  } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCatalogs()
  });
  const [form, setForm] = useState({
    bolla_number: "",
    carro_number: "",
    product_id: "",
    quantity: "",
    destination: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    if (!employee) return;
    if (!form.bolla_number || !form.carro_number || !form.product_id || !form.quantity) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    setSubmitting(true);
    const res = await submitShipment({
      data: {
        bolla_number: form.bolla_number.trim(),
        carro_number: form.carro_number.trim(),
        product_id: form.product_id,
        quantity: Number(form.quantity),
        destination: form.destination || null,
        notes: form.notes || null,
        employee_id: employee.id
      }
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Etichetta generata");
    setForm({
      bolla_number: "",
      carro_number: "",
      product_id: "",
      quantity: "",
      destination: "",
      notes: ""
    });
    qc.invalidateQueries({
      queryKey: ["shipments"]
    });
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Spedizioni" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Etichette generate e coda controllata dal database locale" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Radio, { className: "h-3 w-3 text-primary" }),
        "Sync 30s"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Truck, label: "Etichette", value: String(data?.kpi.count24h ?? 0) }),
      /* @__PURE__ */ jsx(Stat, { icon: Package, label: "Pezzi", value: (data?.kpi.qty24h ?? 0).toLocaleString("it-IT") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]", children: [
        /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 text-base font-semibold", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 text-primary" }),
          " Genera etichetta"
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-3", children: [
          /* @__PURE__ */ jsx(Input, { label: "N. Bolla *", value: form.bolla_number, onChange: (value) => setForm({
            ...form,
            bolla_number: value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "N. Carro *", value: form.carro_number, onChange: (value) => setForm({
            ...form,
            carro_number: value
          }) }),
          /* @__PURE__ */ jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsx("span", { className: "mb-1 block text-sm font-medium", children: "Prodotto *" }),
            /* @__PURE__ */ jsxs("select", { value: form.product_id, onChange: (event) => setForm({
              ...form,
              product_id: event.target.value
            }), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "- seleziona -" }),
              catalogs?.products.map((product) => /* @__PURE__ */ jsxs("option", { value: product.id, children: [
                product.code,
                " · ",
                product.name
              ] }, product.id))
            ] })
          ] }),
          /* @__PURE__ */ jsx(Input, { label: "Quantità pezzi *", value: form.quantity, onChange: (value) => setForm({
            ...form,
            quantity: value
          }), type: "number" }),
          /* @__PURE__ */ jsx(Input, { label: "Destinazione", value: form.destination, onChange: (value) => setForm({
            ...form,
            destination: value
          }) }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: submitting, className: "w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50", children: submitting ? "Salvataggio..." : "Genera etichetta" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "mb-4 text-base font-semibold", children: "Etichette uscite" }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-left text-xs text-muted-foreground uppercase", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Data" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Bolla" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Carro" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-4", children: "Prodotto" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 pr-4 text-right", children: "Pezzi" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            isLoading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-6 text-center text-muted-foreground", children: "Caricamento..." }) }),
            (data?.shipments ?? []).map((shipment) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border last:border-0", children: [
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 text-muted-foreground", children: new Date(shipment.label_generated_at).toLocaleString("it-IT") }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 font-mono font-semibold", children: shipment.bolla_number }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 font-mono", children: shipment.carro_number }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-4", children: shipment.products?.name ?? "-" }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 text-right font-semibold", children: shipment.quantity })
            ] }, shipment.id))
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
function Input({
  label,
  value,
  onChange,
  type = "text"
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsx("input", { type, value, onChange: (event) => onChange(event.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
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
  SpedizioniPage as component
};
