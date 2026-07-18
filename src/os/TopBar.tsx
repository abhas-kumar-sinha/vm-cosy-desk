import { useEffect, useState } from "react";
import { useOS } from "@/store/os-store";
import { LayoutGrid, Maximize2, Minimize2, Command, Cpu, Power, LogOut } from "lucide-react";
import { agent, type AgentSession } from "@/lib/agent";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function TopBar({ session, onLogout }: { session: AgentSession; onLogout: () => void }) {
  const now = useClock();
  const setActivities = useOS((s) => s.setActivities);
  const showActivities = useOS((s) => s.showActivities);
  const openApp = useOS((s) => s.openApp);
  const setLauncherOpen = useOS((s) => s.setLauncherOpen);
  const [tray, setTray] = useState(false);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const dateLabel = now ? now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";
  const timeLabel = now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";

  const doLogout = async () => {
    try { await agent.auth.logout(); } catch {}
    onLogout();
  };

  return (
    <div className="pointer-events-auto fixed inset-x-0 top-0 z-[1000] flex h-8 items-center justify-between px-3 text-xs text-panel-foreground glass-panel">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivities(!showActivities)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition hover:bg-white/10 active:scale-95"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Activities
        </button>
        <span className="text-white/40">•</span>
        <button
          onClick={() => setLauncherOpen(true)}
          className="rounded-md px-2 py-1 text-white/70 transition hover:bg-white/10"
        >
          LovableOS
        </button>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-white/90" suppressHydrationWarning>
        <span className="font-medium">{dateLabel}</span>
        <span className="tabular-nums">{timeLabel}</span>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggleFullscreen} title={isFs ? "Exit fullscreen" : "Enter fullscreen"} className="rounded-md p-1.5 transition hover:bg-white/10 active:scale-90">
          {isFs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => openApp("monitor")} title="System Monitor" className="rounded-md p-1.5 transition hover:bg-white/10 active:scale-90">
          <Cpu className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setTray((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-white/10 active:scale-95"
        >
          <Command className="h-3.5 w-3.5" />
          <span className="tabular-nums">{session.username}@{session.uid === 0 ? "root" : "vm"}</span>
        </button>
      </div>

      {tray && (
        <div className="absolute right-2 top-9 w-72 origin-top-right rounded-xl p-3 text-sm glass-panel animate-in-scale">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{session.username}</div>
              <div className="text-[11px] text-white/50">uid {session.uid} · {session.home}</div>
            </div>
            <button className="text-white/50 hover:text-white" onClick={() => setTray(false)}>×</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TrayTile icon={LayoutGrid} label="Overview" onClick={() => { setTray(false); setActivities(true); }} />
            <TrayTile icon={isFs ? Minimize2 : Maximize2} label={isFs ? "Windowed" : "Fullscreen"} onClick={() => { setTray(false); toggleFullscreen(); }} />
            <TrayTile icon={Cpu} label="Monitor" onClick={() => { setTray(false); openApp("monitor"); }} />
            <TrayTile icon={Power} label="Reload" onClick={() => location.reload()} />
          </div>
          <button
            onClick={doLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground transition hover:bg-destructive/30 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function TrayTile({ icon: Icon, label, onClick }: { icon: typeof Cpu; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1 rounded-lg bg-white/5 p-2 text-left transition hover:bg-white/10 active:scale-95"
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
