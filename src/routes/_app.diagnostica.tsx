import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/diagnostica")({
  component: DiagnosticaLayout,
});

function DiagnosticaLayout() {
  return <Outlet />;
}
