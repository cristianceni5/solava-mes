import { useEffect, useState, useCallback } from "react";

export type SessionEmployee = {
  id: string;
  matricola: string;
  full_name: string;
  role: "operatore" | "magazziniere" | "caporeparto" | "admin";
  phase_id: string;
  phase_name: string;
};

const KEY = "solava.mes.session";

export function getSession(): SessionEmployee | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionEmployee) : null;
  } catch {
    return null;
  }
}

export function setSession(emp: SessionEmployee | null) {
  if (typeof window === "undefined") return;
  if (emp) localStorage.setItem(KEY, JSON.stringify(emp));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("solava-auth"));
}

export function useAuth() {
  const [employee, setEmployeeState] = useState<SessionEmployee | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEmployeeState(getSession());
    setReady(true);
    const onChange = () => setEmployeeState(getSession());
    window.addEventListener("solava-auth", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("solava-auth", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const logout = useCallback(() => setSession(null), []);

  return { employee, ready, logout };
}
