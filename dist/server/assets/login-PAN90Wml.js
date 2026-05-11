import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useServerFn, g as getMesOptions, l as loginEmployee } from "./mes.functions-DoPQPgdP.js";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Factory, User, KeyRound } from "lucide-react";
import { u as useAuth, s as setSession } from "./auth-N2sa7GQg.js";
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
function LoginPage() {
  const login = useServerFn(loginEmployee);
  const fetchOptions = useServerFn(getMesOptions);
  const navigate = useNavigate();
  const {
    employee,
    ready
  } = useAuth();
  const {
    data: options
  } = useQuery({
    queryKey: ["mes-options"],
    queryFn: () => fetchOptions()
  });
  const [matricola, setMatricola] = useState("");
  const [pin, setPin] = useState("");
  const [phaseId, setPhaseId] = useState("verde");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (ready && employee) navigate({
      to: "/"
    });
  }, [ready, employee, navigate]);
  async function onSubmit(e) {
    e.preventDefault();
    if (!matricola || !pin || !phaseId) return;
    setBusy(true);
    try {
      const res = await login({
        data: {
          matricola: matricola.trim(),
          pin: pin.trim(),
          phase_id: phaseId
        }
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSession(res.employee);
      toast.success(`${res.employee.full_name} · ${res.employee.phase_name}`);
      navigate({
        to: "/"
      });
    } catch (err) {
      console.error(err);
      toast.error("Errore di rete");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("form", { onSubmit, className: "grid w-full max-w-5xl gap-6 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:grid-cols-[360px_1fr]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-between rounded-md bg-foreground p-6 text-background", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Factory, { className: "h-9 w-9" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black tracking-tight", children: "SO.LA.VA MES" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-background/80", children: "Produzione laterizi in cotto · Linee Mattoni e Tegole" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 text-sm text-background/70", children: "Demo locale: 1001/1234 · 1002/2345 · 1003/3456 · 9999/0000" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold", children: "Accesso postazione" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg text-muted-foreground", children: "Seleziona la fase di lavoro prima di entrare." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-2 block text-lg font-semibold", children: "Matricola" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(User, { className: "absolute top-5 left-4 h-6 w-6 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { inputMode: "numeric", autoComplete: "off", value: matricola, onChange: (e) => setMatricola(e.target.value), className: "h-16 w-full rounded-md border border-input bg-background pr-4 pl-14 text-2xl font-bold outline-none focus:ring-4 focus:ring-ring/30", placeholder: "1001" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-2 block text-lg font-semibold", children: "PIN" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(KeyRound, { className: "absolute top-5 left-4 h-6 w-6 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { type: "password", inputMode: "numeric", autoComplete: "off", value: pin, onChange: (e) => setPin(e.target.value), className: "h-16 w-full rounded-md border border-input bg-background pr-4 pl-14 text-2xl font-bold tracking-widest outline-none focus:ring-4 focus:ring-ring/30", placeholder: "••••" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-3 text-lg font-semibold", children: "Fase postazione" }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: options?.phases.map((phase) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPhaseId(phase.id), className: phaseId === phase.id ? "h-20 rounded-md bg-primary px-4 text-xl font-black text-primary-foreground shadow" : "h-20 rounded-md border border-border bg-background px-4 text-xl font-bold hover:bg-accent", children: phase.name }, phase.id)) })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "mt-8 h-16 w-full rounded-md bg-foreground text-2xl font-black text-background shadow transition-opacity disabled:opacity-50", children: busy ? "Accesso in corso..." : "ENTRA" })
    ] })
  ] }) });
}
export {
  LoginPage as component
};
