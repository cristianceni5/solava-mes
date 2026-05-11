export const productionLines = [
  {
    id: "mattoni",
    name: "LINEA MATTONI",
    output: "Lingl",
    printer: "ETI-MATTONI-01",
  },
  {
    id: "tegole",
    name: "LINEA TEGOLE",
    output: "Capaccioli",
    printer: "ETI-TEGOLE-01",
  },
] as const;

export const productionPhases = [
  { id: "verde", name: "Verde" },
  { id: "qc-verde", name: "QC Verde" },
  { id: "secco", name: "Secco" },
  { id: "qc-secco", name: "QC Secco" },
  { id: "cotto", name: "Cotto" },
  { id: "qc-cotto", name: "QC Cotto" },
  { id: "imballaggio", name: "Imballaggio" },
  { id: "fine", name: "Fine" },
] as const;

export type ProductionLineId = (typeof productionLines)[number]["id"];
export type ProductionPhaseId = (typeof productionPhases)[number]["id"];

export function getLine(lineId: string) {
  return productionLines.find((line) => line.id === lineId);
}

export function getPhase(phaseId: string) {
  return productionPhases.find((phase) => phase.id === phaseId);
}
