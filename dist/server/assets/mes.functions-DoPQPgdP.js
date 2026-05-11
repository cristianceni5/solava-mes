import * as React from "react";
import { useRouter, isRedirect } from "@tanstack/react-router";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "./server-DsZKktrW.js";
import { z } from "zod";
import { p as productionPhases } from "../server.js";
function useServerFn(serverFn) {
  const router = useRouter();
  return React.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const phaseIds = productionPhases.map((phase) => phase.id);
const loginSchema = z.object({
  matricola: z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9]+$/),
  pin: z.string().trim().min(4).max(10).regex(/^[0-9]+$/),
  phase_id: z.enum(phaseIds)
});
const loginEmployee = createServerFn({
  method: "POST"
}).inputValidator((data) => loginSchema.parse(data)).handler(createSsrRpc("69ff350f51ee0238018bcebc6478c818991f98390604875965e4c2098075f9ac"));
const getMesOptions = createServerFn({
  method: "GET"
}).handler(createSsrRpc("752a5a69b59235bee304f63f73b4f044451546dc4746a860f3e6622ea9e157ab"));
const getPrintQueue = createServerFn({
  method: "GET"
}).handler(createSsrRpc("62417faa60b3fd4af62a789c7491878093504367159e5eede56f947ac0d34fb6"));
const workstationSchema = z.object({
  phase_id: z.enum(phaseIds)
});
const getPhaseWorkstation = createServerFn({
  method: "POST"
}).inputValidator((data) => workstationSchema.parse(data)).handler(createSsrRpc("ea14f588bf3c9042ba15c6cc942bb3f7dc9fcf5793e29036551b02dd6994d3a3"));
const phaseReceiptSchema = z.object({
  employee_id: z.string().uuid(),
  phase_id: z.enum(phaseIds),
  line_id: z.enum(["mattoni", "tegole"]),
  plc_event_id: z.string().uuid()
});
const confirmPhaseReceipt = createServerFn({
  method: "POST"
}).inputValidator((data) => phaseReceiptSchema.parse(data)).handler(createSsrRpc("eb6ec10f1534f53fc0e0aa7fa0ce77063dc4fcd1a90637bb3d3cb2b7f4014539"));
const getCatalogs = createServerFn({
  method: "GET"
}).handler(createSsrRpc("b34fa1858297b965a3f4b9f006394282d79d19ef9fcbf0beac90633d8a8352ec"));
const entrySchema = z.object({
  employee_id: z.string().uuid(),
  product_id: z.string().uuid(),
  machine_id: z.string().uuid(),
  quantity: z.number().int().positive().max(1e6),
  scrap: z.number().int().min(0).max(1e6),
  shift: z.enum(["mattina", "pomeriggio", "notte"]),
  notes: z.string().trim().max(500).optional().nullable()
});
const submitProduction = createServerFn({
  method: "POST"
}).inputValidator((data) => entrySchema.parse(data)).handler(createSsrRpc("ceb1e9379b475e155445eeeb49d0ddc99be201e97dcf7f9a01a92fd0dc7ef503"));
const getDashboard = createServerFn({
  method: "POST"
}).inputValidator((data) => z.object({
  employee_id: z.string().uuid()
}).parse(data)).handler(createSsrRpc("957fa7000c3c8a2bc649b6b502866baf1260837077eb9536d6c65df96b7500b6"));
const getEmployeesList = createServerFn({
  method: "GET"
}).handler(createSsrRpc("0b09feac485799a8d409fd6b50d9d76c5a5ca5a3f91997beace341dfa78820f6"));
const shipmentSchema = z.object({
  bolla_number: z.string().trim().min(1).max(30),
  carro_number: z.string().trim().min(1).max(30),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(1e6),
  destination: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  employee_id: z.string().uuid()
});
const createShipment = createServerFn({
  method: "POST"
}).inputValidator((data) => shipmentSchema.parse(data)).handler(createSsrRpc("12164837b5a29c1fb0c28fdf8bbbc68e6c64fcade53413c80a1024712111443a"));
const getShipments = createServerFn({
  method: "GET"
}).handler(createSsrRpc("475cd6465ec3f70891c317914228ab1c4677519099488a77f8ac956e28d82041"));
export {
  getPhaseWorkstation as a,
  getCatalogs as b,
  confirmPhaseReceipt as c,
  getDashboard as d,
  getPrintQueue as e,
  getShipments as f,
  getMesOptions as g,
  createShipment as h,
  getEmployeesList as i,
  loginEmployee as l,
  submitProduction as s,
  useServerFn as u
};
