import { useEffect } from "react";
import { useOS, type AppId, type WindowState } from "@/store/os-store";
import { TopBar } from "@/os/TopBar";
import { Dock } from "@/os/Dock";
import { AppLauncher } from "@/os/AppLauncher";
import { Activities } from "@/os/Activities";
import { AppWindow } from "@/os/AppWindow";
import { APP_MAP } from "@/os/apps-registry";
import { TerminalApp } from "@/os/apps/TerminalApp";
import { FilesApp } from "@/os/apps/FilesApp";
import { EditorApp } from "@/os/apps/EditorApp";
import { SettingsApp } from "@/os/apps/SettingsApp";
import { MonitorApp } from "@/os/apps/MonitorApp";
import { ServicesApp } from "@/os/apps/ServicesApp";
import { DockerApp } from "@/os/apps/DockerApp";
import type { AgentSession } from "@/lib/agent";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuLabel, MenuSub } from "@/os/ContextMenu";

const WALLPAPERS: Record<string, string> = {
  sonoma:
    "radial-gradient(circle at 10% 10%, #FF9E7D 0%, transparent 40%), radial-gradient(circle at 90% 20%, #F28FD1 0%, transparent 45%), radial-gradient(circle at 50% 100%, #6AB6FF 0%, transparent 55%), linear-gradient(180deg, #2A1B4E 0%, #12143F 100%)",
  sequoia:
    "radial-gradient(ellipse at 30% 40%, #4A5AE8 0%, transparent 55%), radial-gradient(circle at 80% 70%, #7B4FE8 0%, transparent 55%), linear-gradient(180deg, #0A0E27 0%, #1A0E3F 100%)",
  bigsur:
    "radial-gradient(circle at 20% 30%, #F5A891 0%, transparent 50%), radial-gradient(circle at 70% 60%, #7BB4E8 0%, transparent 55%), linear-gradient(180deg, #1E3A5F 0%, #2C1B4E 100%)",
  ventura:
    "radial-gradient(circle at 50% 20%, #FF8FAB 0%, transparent 50%), radial-gradient(circle at 50% 100%, #C58FFF 0%, transparent 60%), linear-gradient(180deg, #1A0E3F 0%, #3A1B5F 100%)",
  monterey:
    "radial-gradient(circle at 15% 15%, #A594F9 0%, transparent 50%), radial-gradient(circle at 85% 85%, #F5768D 0%, transparent 50%), linear-gradient(135deg, #1B1B2E 0%, #2E1B3E 100%)",
};

function renderApp(win: WindowState) {
  switch (win.appId) {
    case "terminal": return <TerminalApp />;
    case "files":    return <FilesApp openInEditor={(path) => useOS.getState().openApp("editor", { title: path.split("/").pop(), payload: { path } })} />;
    case "editor":   return <EditorApp initialPath={(win.payload?.path as string | undefined) ?? null} />;
    case "settings": return <SettingsApp />;
    case "monitor":  return <MonitorApp />;
    case "services": return <ServicesApp />;
    case "docker":   return <DockerApp />;
  }
}

const DESKTOP_ICONS: AppId[] = ["files", "terminal", "editor", "monitor"];

export function Desktop({ session, onLogout }: { session: AgentSession; onLogout: () => void }) {
  const windows = useOS((s) => s.windows);
  const wallpaper = useOS((s) => s.wallpaper);
  const openApp = useOS((s) => s.openApp);
  const setWallpaper = useOS((s) => s.setWallpaper);

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
    <Menu>
      <MenuTrigger asChild>
        <div
          className="fixed inset-0 overflow-hidden"
          style={{ background: WALLPAPERS[wallpaper] ?? WALLPAPERS.sonoma }}
        >
          <TopBar session={session} onLogout={onLogout} />

          <div className="absolute right-4 top-10 grid grid-cols-1 gap-3">
            {DESKTOP_ICONS.map((id) => {
              const app = APP_MAP[id];
              const Icon = app.icon;
              return (
                <button
                  key={id}
                  onDoubleClick={() => openApp(id)}
                  onClick={(e) => e.currentTarget.focus()}
                  className="group flex w-20 flex-col items-center gap-1 rounded-lg p-2 text-white outline-none transition hover:bg-white/10 focus:bg-white/15"
                >
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${app.color} shadow-lg ring-1 ring-inset ring-white/10`}>
                    <Icon className="h-6 w-6 drop-shadow" />
                  </div>
                  <span className="text-center text-[11px] font-medium drop-shadow">{app.name}</span>
                </button>
              );
            })}
          </div>

          {windows.map((w) => (
            <div key={w.id} data-window>
              <AppWindow win={w}>{renderApp(w)}</AppWindow>
            </div>
          ))}

          <AppLauncher />
          <Activities />
          <Dock />
        </div>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>Desktop</MenuLabel>
        <MenuItem onSelect={() => openApp("files")}>New Finder Window</MenuItem>
        <MenuItem onSelect={() => openApp("terminal")}>Open Terminal Here</MenuItem>
        <MenuItem onSelect={() => location.reload()}>Refresh</MenuItem>
        <MenuSeparator />
        <MenuSub label="Change Wallpaper">
          {Object.keys(WALLPAPERS).map((w) => (
            <MenuItem key={w} onSelect={() => setWallpaper(w)}>
              <span className="capitalize">{w}</span>
            </MenuItem>
          ))}
        </MenuSub>
        <MenuItem onSelect={() => openApp("settings")}>Display Settings…</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => useOS.getState().setActivities(true)}>Mission Control</MenuItem>
        <MenuItem onSelect={() => useOS.getState().setLauncherOpen(true)}>Launchpad</MenuItem>
      </MenuContent>
    </Menu>
  );
}
