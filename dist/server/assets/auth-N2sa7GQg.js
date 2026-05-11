import { useState, useEffect, useCallback } from "react";
const KEY = "solava.mes.session";
function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setSession(emp) {
  if (typeof window === "undefined") return;
  if (emp) localStorage.setItem(KEY, JSON.stringify(emp));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("solava-auth"));
}
function useAuth() {
  const [employee, setEmployeeState] = useState(null);
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
export {
  setSession as s,
  useAuth as u
};
