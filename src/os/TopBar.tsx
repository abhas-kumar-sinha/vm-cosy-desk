import { useEffect, useState } from "react";
import { useOS } from "@/store/os-store";
import {
  Wifi,
  Volume2,
  BatteryFull,
  Search,
  Power,
  LayoutGrid,
  Moon,
  Bluetooth,
} from "lucide-react";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function TopBar() {
  const now = useClock();
  const setActivities = useOS((s) => s.setActivities);
  const showActivities = useOS((s) => s.showActivities);
  const [tray, setTray] = useState(false);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="pointer-events-auto fixed inset-x-0 top-0 z-[1000] flex h-8 items-center justify-between px-3 text-xs text-panel-foreground glass-panel">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivities(!showActivities)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition hover:bg-white/10"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Activities
        </button>
        <span className="text-white/40">•</span>
        <span className="text-white/70">LovableOS</span>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-white/90">
        <span className="font-medium">{dateLabel}</span>
        <span className="tabular-nums">{timeLabel}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setTray((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-white/10"
        >
          <Wifi className="h-3.5 w-3.5" />
          <Bluetooth className="h-3.5 w-3.5" />
          <Volume2 className="h-3.5 w-3.5" />
          <BatteryFull className="h-3.5 w-3.5" />
        </button>
      </div>

      {tray && (
        <div className="absolute right-2 top-9 w-72 rounded-xl p-3 text-sm glass-panel">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Quick Settings</span>
            <button className="text-white/50 hover:text-white" onClick={() => setTray(false)}>
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TrayTile icon={Wifi} label="Wi-Fi" active />
            <TrayTile icon={Bluetooth} label="Bluetooth" active />
            <TrayTile icon={Moon} label="Dark Mode" active />
            <TrayTile icon={Search} label="Search" />
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                <span>Volume</span>
                <span>70%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[70%] rounded-full bg-primary" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                <span>Brightness</span>
                <span>85%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[85%] rounded-full bg-accent-orange" />
              </div>
            </div>
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground transition hover:bg-destructive/30">
            <Power className="h-4 w-4" /> Power off
          </button>
        </div>
      )}
    </div>
  );
}

function TrayTile({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Wifi;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex flex-col items-start gap-1 rounded-lg p-2 text-left transition ${
        active ? "bg-primary/20 text-primary-foreground" : "bg-white/5 hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
