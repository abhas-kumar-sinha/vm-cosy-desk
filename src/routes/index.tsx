import { createFileRoute } from "@tanstack/react-router";
import { Desktop } from "@/os/Desktop";
import { BootScreen } from "@/os/BootScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LovableOS — a Linux desktop for your VM" },
      {
        name: "description",
        content:
          "A full-featured Linux-style web desktop: windows, dock, terminal, files, editor and more, right in your browser.",
      },
      { property: "og:title", content: "LovableOS — Linux desktop in the browser" },
      {
        property: "og:description",
        content:
          "Feature-rich Linux-inspired desktop UI with terminal, file manager, editor, and system monitor.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <BootScreen />
      <Desktop />
    </>
  );
}
