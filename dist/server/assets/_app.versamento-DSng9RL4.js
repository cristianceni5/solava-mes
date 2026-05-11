import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn, b as getCatalogs, s as submitProduction } from "./mes.functions-DoPQPgdP.js";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
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
function Versamento() {
  const {
    employee
  } = useAuth();
  const fetchCat = useServerFn(getCatalogs);
  const submit = useServerFn(submitProduction);
  const qc = useQueryClient();
  const {
    data
  } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCat()
  });
  const [productId, setProductId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [shift, setShift] = useState("mattina");
  const [quantity, setQuantity] = useState("");
  const [scrap, setScrap] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    if (!productId || !machineId || !quantity) {
      toast.error("Compila prodotto, macchinario e quantità");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          employee_id: employee.id,
          product_id: productId,
          machine_id: machineId,
          quantity: parseInt(quantity, 10),
          scrap: parseInt(scrap || "0", 10),
          shift,
          notes: notes || null
        }
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Versamento registrato");
      setQuantity("");
      setScrap("0");
      setNotes("");
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      qc.invalidateQueries({
        queryKey: ["history"]
      });
    } catch (err) {
      console.error(err);
      toast.error("Errore di rete");
    } finally {
      setBusy(false);
    }
  }
  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground", style: {
        background: "var(--gradient-brand)"
      }, children: /* @__PURE__ */ jsx(PackagePlus, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Versamento produzione" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Registra i pezzi prodotti su una linea" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Prodotto", children: /* @__PURE__ */ jsxs("select", { value: productId, onChange: (e) => setProductId(e.target.value), className: inputCls, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "- Seleziona -" }),
          data?.products.map((product) => /* @__PURE__ */ jsxs("option", { value: product.id, children: [
            product.code,
            " - ",
            product.name
          ] }, product.id))
        ] }) }),
        /* @__PURE__ */ jsx(Field, { label: "Macchinario", children: /* @__PURE__ */ jsxs("select", { value: machineId, onChange: (e) => setMachineId(e.target.value), className: inputCls, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "- Seleziona -" }),
          data?.machines.map((machine) => /* @__PURE__ */ jsxs("option", { value: machine.id, children: [
            machine.line,
            " · ",
            machine.name
          ] }, machine.id))
        ] }) }),
        /* @__PURE__ */ jsx(Field, { label: "Quantità prodotta", children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, value: quantity, onChange: (e) => setQuantity(e.target.value), className: inputCls, placeholder: "0" }) }),
        /* @__PURE__ */ jsx(Field, { label: "Scarti", children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, value: scrap, onChange: (e) => setScrap(e.target.value), className: inputCls }) }),
        /* @__PURE__ */ jsx(Field, { label: "Turno", children: /* @__PURE__ */ jsxs("select", { value: shift, onChange: (e) => setShift(e.target.value), className: inputCls, children: [
          /* @__PURE__ */ jsx("option", { value: "mattina", children: "Mattina" }),
          /* @__PURE__ */ jsx("option", { value: "pomeriggio", children: "Pomeriggio" }),
          /* @__PURE__ */ jsx("option", { value: "notte", children: "Notte" })
        ] }) }),
        /* @__PURE__ */ jsx(Field, { label: "Operatore", children: /* @__PURE__ */ jsx("input", { disabled: true, value: `${employee?.full_name} (${employee?.matricola})`, className: `${inputCls} text-muted-foreground` }) })
      ] }),
      /* @__PURE__ */ jsx(Field, { label: "Note (facoltative)", children: /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), maxLength: 500, rows: 3, className: inputCls, placeholder: "Anomalie, fermo macchina, ecc." }) }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90 disabled:opacity-50", children: busy ? "Salvataggio..." : "Registra versamento" }) })
    ] })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    children
  ] });
}
export {
  Versamento as component
};
