import { useOS } from "@/store/os-store";
import { APPS } from "./apps-registry";
import { LayoutGrid, Trash2 } from "lucide-react";

const PINNED = ["files", "terminal", "editor", "browser", "settings", "monitor"] as const;

export function Dock() {
  const openApp = useOS((s) => s.openApp);
  const windows = useOS((s) => s.windows);
  const setLauncherOpen = useOS((s) => s.setLauncherOpen);
  const launcherOpen = useOS((s) => s.launcherOpen);
  const focusWindow = useOS((s) => s.focusWindow);

  const openIds = new Set(windows.map((w) => w.appId));

  return (
    <div className="pointer-events-auto fixed bottom-3 left-1/2 z-[900] -translate-x-1/2">
      <div className="flex items-end gap-2 rounded-2xl px-3 py-2 glass-panel">
        {PINNED.map((id) => {
          const app = APPS.find((a) => a.id === id)!;
          const Icon = app.icon;
          const active = openIds.has(id);
          const win = windows.find((w) => w.appId === id);
          return (
            <button
              key={id}
              title={app.name}
              onClick={() => (win ? focusWindow(win.id) : openApp(id))}
              className="dock-item group relative flex h-12 w-12 items-center justify-center rounded-xl"
            >
              <div
                className={`flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white drop-shadow" />
              </div>
              {active && (
                <span className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-primary" />
              )}
              <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100">
                {app.name}
              </span>
            </button>
          );
        })}

        <div className="mx-1 h-10 w-px bg-white/10" />

        <button
          onClick={() => setLauncherOpen(!launcherOpen)}
          title="Show Applications"
          className="dock-item flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5"
        >
          <LayoutGrid className="h-5 w-5 text-white" />
        </button>

        <button
          title="Trash"
          className="dock-item flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-600 to-neutral-800"
        >
          <Trash2 className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}
