import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOS } from "@/store/os-store";
import { Apple, Wifi, Search, Cpu, LogOut, Maximize2, Minimize2, Command, LayoutGrid } from "lucide-react";
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
  const openApp = useOS((s) => s.openApp);
  const setLauncherOpen = useOS((s) => s.setLauncherOpen);
  const setFullscreen = useOS((s) => s.setFullscreen);
  const isFullscreen = useOS((s) => s.isFullscreen);
  const windows = useOS((s) => s.windows);
  const activeId = useOS((s) => s.activeId);
  const [tray, setTray] = useState(false);
  const [appleMenu, setAppleMenu] = useState(false);
  const [sensorHover, setSensorHover] = useState(false);
  const [barHover, setBarHover] = useState(false);
  const [isFsApi, setIsFsApi] = useState(false);

  useEffect(() => {
    const onFs = () => {
      const v = !!document.fullscreenElement;
      setIsFsApi(v);
      setFullscreen(v);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [setFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const anyMaximized = windows.some((w) => w.maximized && !w.minimized);
  const shouldHide = (isFsApi || anyMaximized) && !barHover && !sensorHover && !tray && !appleMenu;

  const dateLabel = now ? now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";
  const timeLabel = now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";

  const doLogout = async () => {
    try { await agent.auth.logout(); } catch {}
    onLogout();
  };

  const activeWin = windows.find((w) => w.id === activeId);
  const activeTitle = activeWin?.title ?? "Finder";

  return (
    <>
      {/* top sensor for reveal */}
      <div
        onMouseEnter={() => setSensorHover(true)}
        onMouseLeave={() => setSensorHover(false)}
        className="pointer-events-auto fixed inset-x-0 top-0 z-[999] h-1"
        aria-hidden
      />
      <motion.div
        onMouseEnter={() => setBarHover(true)}
        onMouseLeave={() => setBarHover(false)}
        initial={false}
        animate={{ y: shouldHide ? -32 : 0, opacity: shouldHide ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="pointer-events-auto fixed inset-x-0 top-0 z-[1000] flex h-7 items-center justify-between border-b border-white/5 bg-black/40 px-3 text-[13px] text-white backdrop-blur-2xl backdrop-saturate-150"
        style={{ WebkitFontSmoothing: "antialiased" }}
      >
        {/* Left cluster */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAppleMenu((v) => !v)}
            className="rounded p-1 transition hover:bg-white/10 active:scale-90"
            aria-label="Apple menu"
          >
            <Apple className="h-4 w-4" fill="currentColor" />
          </button>
          <span className="font-semibold tracking-tight">{activeTitle}</span>
          <button onClick={() => setActivities(true)} className="hidden text-white/70 transition hover:text-white md:inline">File</button>
          <button className="hidden text-white/70 transition hover:text-white md:inline">Edit</button>
          <button className="hidden text-white/70 transition hover:text-white md:inline">View</button>
          <button onClick={() => setLauncherOpen(true)} className="hidden text-white/70 transition hover:text-white md:inline">Window</button>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2.5">
          <button onClick={() => setActivities(true)} title="Mission Control" className="rounded p-1 transition hover:bg-white/10 active:scale-90">
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={toggleFullscreen} title={isFsApi ? "Exit fullscreen" : "Enter fullscreen"} className="rounded p-1 transition hover:bg-white/10 active:scale-90">
            {isFsApi ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => openApp("monitor")} title="System Monitor" className="rounded p-1 transition hover:bg-white/10 active:scale-90">
            <Cpu className="h-3.5 w-3.5" />
          </button>
          <Wifi className="h-3.5 w-3.5 opacity-70" />
          <button onClick={() => setLauncherOpen(true)} title="Search" className="rounded p-1 transition hover:bg-white/10 active:scale-90">
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTray((v) => !v)}
            className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition hover:bg-white/10 active:scale-95"
          >
            <span className="text-white/80">{dateLabel}</span>
            <span className="tabular-nums text-white">{timeLabel}</span>
          </button>
          <button
            onClick={() => setTray((v) => !v)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:bg-white/10 active:scale-95"
          >
            <Command className="h-3 w-3 opacity-60" />
            <span className="text-xs">{session.username}</span>
          </button>
        </div>
      </motion.div>

      {/* Apple menu */}
      {appleMenu && (
        <div
          className="fixed left-2 top-8 z-[1001] w-64 origin-top-left rounded-xl border border-white/10 bg-neutral-900/85 p-1 text-sm shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
          onMouseLeave={() => setAppleMenu(false)}
        >
          <MenuRow label="About LovableOS" onClick={() => { setAppleMenu(false); openApp("settings"); }} />
          <Divider />
          <MenuRow label="System Settings…" onClick={() => { setAppleMenu(false); openApp("settings"); }} />
          <MenuRow label="Activity Monitor" onClick={() => { setAppleMenu(false); openApp("monitor"); }} />
          <Divider />
          <MenuRow label="Fullscreen" shortcut="⌃⌘F" onClick={() => { setAppleMenu(false); toggleFullscreen(); }} />
          <MenuRow label="Restart" onClick={() => location.reload()} />
          <Divider />
          <MenuRow label={`Log Out ${session.username}…`} danger onClick={() => { setAppleMenu(false); doLogout(); }} />
        </div>
      )}

      {/* Right tray */}
      {tray && (
        <div className="fixed right-2 top-8 z-[1001] w-72 rounded-xl border border-white/10 bg-neutral-900/85 p-3 text-sm shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{session.username}</div>
              <div className="text-[11px] text-white/50">uid {session.uid} · {session.home}</div>
            </div>
            <button className="text-white/50 hover:text-white" onClick={() => setTray(false)}>×</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TrayTile icon={LayoutGrid} label="Mission Control" onClick={() => { setTray(false); setActivities(true); }} />
            <TrayTile icon={isFsApi ? Minimize2 : Maximize2} label={isFsApi ? "Windowed" : "Fullscreen"} onClick={() => { setTray(false); toggleFullscreen(); }} />
            <TrayTile icon={Cpu} label="Monitor" onClick={() => { setTray(false); openApp("monitor"); }} />
            <TrayTile icon={Search} label="Launchpad" onClick={() => { setTray(false); setLauncherOpen(true); }} />
          </div>
          <button
            onClick={doLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100 transition hover:bg-red-500/30 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </>
  );
}

function MenuRow({ label, onClick, shortcut, danger }: { label: string; onClick?: () => void; shortcut?: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-left text-[13px] transition ${danger ? "text-red-300 hover:bg-red-500/20" : "text-white hover:bg-white/10"}`}
    >
      <span>{label}</span>
      {shortcut && <kbd className="text-[10px] text-white/40">{shortcut}</kbd>}
    </button>
  );
}
function Divider() { return <div className="my-1 h-px bg-white/8" />; }

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
