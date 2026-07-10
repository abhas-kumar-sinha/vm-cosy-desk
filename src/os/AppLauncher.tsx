import { useState } from "react";
import { useOS } from "@/store/os-store";
import { APPS } from "./apps-registry";
import { Search, X } from "lucide-react";

export function AppLauncher() {
  const open = useOS((s) => s.launcherOpen);
  const setOpen = useOS((s) => s.setLauncherOpen);
  const openApp = useOS((s) => s.openApp);
  const [q, setQ] = useState("");

  if (!open) return null;

  const filtered = APPS.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) ||
      a.description.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-[950] flex items-start justify-center bg-black/40 pt-20 backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <div
        className="mx-4 w-full max-w-3xl rounded-2xl p-6 glass-panel boot-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2.5">
          <Search className="h-4 w-4 text-white/50" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applications..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {filtered.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => openApp(app.id)}
                className="group flex flex-col items-center gap-2 rounded-xl p-3 transition hover:bg-white/10"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} shadow-lg transition group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7 text-white drop-shadow" />
                </div>
                <span className="text-center text-xs text-white/90">{app.name}</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-white/50">No applications found</p>
        )}
      </div>
    </div>
  );
}
