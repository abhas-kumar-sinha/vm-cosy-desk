import { createFileRoute } from "@tanstack/react-router";
import { ConnectionGate } from "@/os/ConnectionGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CloudOS — A real Linux desktop for your VM" },
      { name: "description", content: "Self-hosted web desktop for Ubuntu/Debian VMs: real files, terminal, editor, systemctl, Docker." },
      { property: "og:title", content: "CloudOS — A real Linux desktop for your VM" },
      { property: "og:description", content: "Self-hosted web desktop for Ubuntu/Debian VMs: real files, terminal, editor, systemctl, Docker." },
    ],
  }),
  component: Index,
});

function Index() {
  return <ConnectionGate />;
}
