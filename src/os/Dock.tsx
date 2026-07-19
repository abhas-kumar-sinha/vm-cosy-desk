import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/store/os-store";
import { APPS } from "./apps-registry";
import { LayoutGrid, Trash2 } from "lucide-react";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuLabel } from "./ContextMenu";

const PINNED = ["files", "terminal", "editor", "monitor", "services", "docker", "settings"] as const;

export function Dock() {
  const openApp = useOS((s) => s.openApp);
  const windows = useOS((s) => s.windows);
  const setLauncherOpen = useOS((s) => s.setLauncherOpen);
  const launcherOpen = useOS((s) => s.launcherOpen);
  const focusWindow = useOS((s) => s.focusWindow);
  const closeWindow = useOS((s) => s.closeWindow);
  const isFullscreen = useOS((s) => s.isFullscreen);

  const [hovered, setHovered] = useState(false);
  const [sensorHovered, setSensorHovered] = useState(false);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Autohide when in fullscreen mode; reveal on hover of bottom sensor strip.
  const anyMaximized = windows.some((w) => w.maximized && !w.minimized);
  const shouldHide = (isFullscreen || anyMaximized) && !hovered && !sensorHovered;

  const openIds = new Set(windows.map((w) => w.appId));

  return (
    <>
      {/* Reveal sensor — invisible bottom strip that catches mouse to slide dock up */}
      <div
        onMouseEnter={() => setSensorHovered(true)}
        onMouseLeave={() => setSensorHovered(false)}
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[899] h-2"
        aria-hidden
      />

      <motion.div
        ref={dockRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMouseX(null); }}
        onMouseMove={(e) => setMouseX(e.clientX)}
        initial={false}
        animate={{ y: shouldHide ? 100 : 0, opacity: shouldHide ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="pointer-events-auto fixed bottom-2 left-1/2 z-[900] -translate-x-1/2"
      >
        <div className="flex items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150">
          {PINNED.map((id) => {
            const app = APPS.find((a) => a.id === id)!;
            const Icon = app.icon;
            const active = openIds.has(id);
            const win = windows.find((w) => w.appId === id);
            return (
              <Menu key={id}>
                <MenuTrigger asChild>
                  <button
                    title={app.name}
                    onClick={() => (win ? focusWindow(win.id) : openApp(id))}
                    ref={(el) => {
                      if (!el) return;
                      const rect = el.getBoundingClientRect();
                      const center = rect.left + rect.width / 2;
                      const dist = mouseX == null || !hovered ? Infinity : Math.abs(mouseX - center);
                      const scale = dist === Infinity ? 1 : Math.max(1, 1.55 - dist / 90);
                      el.style.transform = `scale(${scale}) translateY(${dist < 40 ? -6 : 0}px)`;
                    }}
                    className="group relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-100"
                  >
                    <div className={`grid h-full w-full place-items-center rounded-xl bg-gradient-to-br ${app.color} shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/10`}>
                      <Icon className="h-6 w-6 text-white drop-shadow" />
                    </div>
                    {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-white shadow" />}
                    <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] opacity-0 transition group-hover:opacity-100">
                      {app.name}
                    </span>
                  </button>
                </MenuTrigger>
                <MenuContent>
                  <MenuLabel>{app.name}</MenuLabel>
                  <MenuItem onSelect={() => (win ? focusWindow(win.id) : openApp(id))}>{win ? "Show" : "Open"}</MenuItem>
                  <MenuItem onSelect={() => openApp(id)}>New window</MenuItem>
                  {win && (
                    <>
                      <MenuSeparator />
                      <MenuItem danger onSelect={() => closeWindow(win.id)}>Quit</MenuItem>
                    </>
                  )}
                </MenuContent>
              </Menu>
            );
          })}

          <div className="mx-1 h-10 w-px bg-white/10" />

          <button
            onClick={() => setLauncherOpen(!launcherOpen)}
            title="Launchpad"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.10]"
          >
            <LayoutGrid className="h-5 w-5 text-white" />
          </button>
          <button
            title="Trash"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.10]"
          >
            <Trash2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </motion.div>
    </>
  );
}

// keep for tree-shaking of imports
export const __unused = AnimatePresence;
