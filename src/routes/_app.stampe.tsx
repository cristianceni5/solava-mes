import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/stampe")({
  component: CodaStampaRedirect,
});

function CodaStampaRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/spedizioni", replace: true });
  }, [navigate]);

  return null;
}
