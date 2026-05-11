import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn, b as getCatalogs, i as getEmployeesList } from "./mes.functions-DoPQPgdP.js";
import { useQuery } from "@tanstack/react-query";
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
function Anagrafica() {
  const fetchCat = useServerFn(getCatalogs);
  const fetchEmp = useServerFn(getEmployeesList);
  const {
    data: cat
  } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => fetchCat()
  });
  const {
    data: emp
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetchEmp()
  });
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Anagrafiche" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Dipendenti, prodotti e macchinari registrati nel MES" })
    ] }),
    /* @__PURE__ */ jsx(Section, { title: "Dipendenti", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left text-xs text-muted-foreground uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Matricola" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Nome" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Ruolo" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Stato" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: emp?.employees.map((employee) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-mono", children: employee.matricola }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: employee.full_name }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 capitalize", children: employee.role }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: employee.active ? "Attivo" : "Disattivato" })
      ] }, employee.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { title: "Prodotti", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left text-xs text-muted-foreground uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Codice" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Nome" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Tipo" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Unità" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: cat?.products.map((product) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-mono", children: product.code }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: product.name }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 capitalize", children: product.type }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: product.unit })
      ] }, product.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Section, { title: "Macchinari & PLC", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left text-xs text-muted-foreground uppercase", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Codice" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Macchina" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Linea" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "PLC" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Rete" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: cat?.machines.map((machine) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-mono", children: machine.code }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: machine.name }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: machine.line }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: machine.plc }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-2 uppercase", children: machine.network })
      ] }, machine.id)) })
    ] }) })
  ] });
}
function Section({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsx("h2", { className: "mb-3 text-lg font-semibold", children: title }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]", children })
  ] });
}
export {
  Anagrafica as component
};
