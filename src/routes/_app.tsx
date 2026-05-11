import { createFileRoute } from "@tanstack/react-router";
import { MesLayout } from "@/components/MesLayout";

export const Route = createFileRoute("/_app")({
  component: MesLayout,
});
