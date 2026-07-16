import { useEffect, useState } from "react";
import { useOS, type AppId } from "@/store/os-store";
import { TopBar } from "@/os/TopBar";
import { Dock } from "@/os/Dock";
import { AppLauncher } from "@/os/AppLauncher";
import { Activities } from "@/os/Activities";
import { AppWindow } from "@/os/AppWindow";
import { APP_MAP } from "@/os/apps-registry";
import { TerminalApp } from "@/os/apps/TerminalApp";
import { FilesApp } from "@/os/apps/FilesApp";
import { EditorApp } from "@/os/apps/EditorApp";
import { BrowserApp } from "@/os/apps/BrowserApp";
import { SettingsApp } from "@/os/apps/SettingsApp";
import { CalculatorApp } from "@/os/apps/CalculatorApp";
import { MonitorApp } from "@/os/apps/MonitorApp";
import { AboutApp } from "@/os/apps/AboutApp";
import { GalleryApp } from "@/os/apps/GalleryApp";
import { MusicApp } from "@/os/apps/MusicApp";
import { PreviewApp } from "@/os/apps/PreviewApp";
import type { WindowState } from "@/store/os-store";

const WALLPAPERS: Record<string, string> = {
  aurora:
    "radial-gradient(circle at 15% 20%, oklch(0.55 0.20 35 / 0.55), transparent 45%), radial-gradient(circle at 85% 30%, oklch(0.55 0.22 300 / 0.55), transparent 50%), radial-gradient(circle at 50% 90%, oklch(0.55 0.15 220 / 0.55), transparent 55%), linear-gradient(135deg, oklch(0.15 0.03 280), oklch(0.10 0.02 260))",
  night:
    "radial-gradient(ellipse at 50% 20%, oklch(0.4 0.15 260 / 0.6), transparent 60%), linear-gradient(180deg, oklch(0.08 0.02 260), oklch(0.14 0.04 250))",
  forest:
    "radial-gradient(circle at 30% 30%, oklch(0.55 0.15 145 / 0.5), transparent 55%), linear-gradient(135deg, oklch(0.15 0.05 155), oklch(0.22 0.08 145))",
  sunset:
    "radial-gradient(circle at 70% 80%, oklch(0.7 0.22 30 / 0.6), transparent 60%), linear-gradient(180deg, oklch(0.30 0.18 45), oklch(0.55 0.20 25))",
};

function renderApp(win: WindowState) {
  switch (win.appId) {
    case "terminal": return <TerminalApp />;
    case "files": return <FilesApp />;
    case "editor": return <EditorApp />;
    case "browser": return <BrowserApp />;
    case "settings": return <SettingsApp />;
    case "calculator": return <CalculatorApp />;
    case "monitor": return <MonitorApp />;
    case "about": return <AboutApp />;
    case "gallery": return <GalleryApp />;
    case "music": return <MusicApp />;
    case "preview": return <PreviewApp winId={win.id} />;
  }
}


const DESKTOP_ICONS: AppId[] = ["files", "terminal", "editor", "about"];

export function Desktop() {
  const windows = useOS((s) => s.windows);
  const wallpaper = useOS((s) => s.wallpaper);
  const openApp = useOS((s) => s.openApp);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const setWallpaper = useOS((s) => s.setWallpaper);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useOS.getState().setActivities(false);
      if ((e.metaKey || e.altKey) && e.key === "F2") useOS.getState().setLauncherOpen(true);
      if (e.key === "F1") {
        e.preventDefault();
        useOS.getState().setActivities(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: WALLPAPERS[wallpaper] ?? WALLPAPERS.aurora }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest("[data-window]")) return;
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <TopBar />

      {/* Desktop icons */}
      <div className="absolute left-4 top-12 grid grid-cols-1 gap-3">
        {DESKTOP_ICONS.map((id) => {
          const app = APP_MAP[id];
          const Icon = app.icon;
          return (
            <button
              key={id}
              onDoubleClick={() => openApp(id)}
              onClick={(e) => e.currentTarget.focus()}
              className="group flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-white outline-none transition hover:bg-white/10 focus:bg-primary/25"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg`}
              >
                <Icon className="h-6 w-6 drop-shadow" />
              </div>
              <span className="text-center text-[11px] font-medium drop-shadow">{app.name}</span>
            </button>
          );
        })}
      </div>

      {/* Windows */}
      {windows.map((w) => (
        <div key={w.id} data-window>
          <AppWindow win={w}>{renderApp(w.appId)}</AppWindow>
        </div>
      ))}

      <AppLauncher />
      <Activities />
      <Dock />

      {ctxMenu && (
        <div
          className="fixed z-[999] w-52 overflow-hidden rounded-lg py-1 text-sm glass-panel"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <MenuItem onClick={() => openApp("terminal")}>Open Terminal</MenuItem>
          <MenuItem onClick={() => openApp("files")}>Open Files</MenuItem>
          <div className="my-1 border-t border-white/10" />
          <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-white/40">
            Change background
          </div>
          {Object.keys(WALLPAPERS).map((w) => (
            <MenuItem key={w} onClick={() => setWallpaper(w)}>
              <span className="capitalize">{w}</span>
            </MenuItem>
          ))}
          <div className="my-1 border-t border-white/10" />
          <MenuItem onClick={() => openApp("settings")}>Display Settings</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-3 py-1.5 text-left text-white/85 transition hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </button>
  );
}
