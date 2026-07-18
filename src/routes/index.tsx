import { createFileRoute } from "@tanstack/react-router";
import { ConnectionGate } from "@/os/ConnectionGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LovableOS — a real Linux desktop for your VM" },
      { name: "description", content: "Self-hosted web desktop for Ubuntu/Debian VMs: real files, terminal, editor, systemctl, Docker." },
      { property: "og:title", content: "LovableOS — real Linux desktop in the browser" },
      { property: "og:description", content: "Install the agent on your VM and get a full browser desktop with real files, shell, /proc, systemctl and Docker." },
    ],
  }),
  component: Index,
});

function Index() {
  return <ConnectionGate />;
}
