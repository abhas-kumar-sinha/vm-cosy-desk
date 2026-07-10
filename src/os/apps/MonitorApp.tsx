import { useEffect, useState } from "react";
import { Cpu, MemoryStick, HardDrive, Network } from "lucide-react";

interface Proc {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  state: "R" | "S" | "D";
}

const BASE_PROCS: Omit<Proc, "cpu" | "mem">[] = [
  { pid: 1, name: "systemd", user: "root", state: "S" },
  { pid: 412, name: "aurora-shell", user: "user", state: "R" },
  { pid: 623, name: "lovable-terminal", user: "user", state: "S" },
  { pid: 742, name: "firefox", user: "user", state: "S" },
  { pid: 815, name: "nautilus", user: "user", state: "S" },
  { pid: 902, name: "pipewire", user: "user", state: "S" },
  { pid: 1042, name: "gnome-settings", user: "user", state: "S" },
  { pid: 1101, name: "dbus-daemon", user: "user", state: "S" },
  { pid: 1233, name: "node", user: "user", state: "R" },
  { pid: 1301, name: "code", user: "user", state: "S" },
];

function jitter(prev: number, spread = 6, min = 0.1, max = 100) {
  const n = prev + (Math.random() - 0.5) * spread;
  return Math.max(min, Math.min(max, n));
}

export function MonitorApp() {
  const [tab, setTab] = useState<"processes" | "resources" | "filesystems">("processes");
  const [cpu, setCpu] = useState(28);
  const [mem, setMem] = useState(52);
  const [net, setNet] = useState(12);
  const [cpuHist, setCpuHist] = useState<number[]>(Array(40).fill(28));
  const [memHist, setMemHist] = useState<number[]>(Array(40).fill(52));
  const [procs, setProcs] = useState<Proc[]>(
    BASE_PROCS.map((p) => ({ ...p, cpu: Math.random() * 8, mem: Math.random() * 6 })),
  );

  useEffect(() => {
    const t = setInterval(() => {
      const c = jitter(cpu, 10);
      const m = jitter(mem, 4);
      const n = jitter(net, 8);
      setCpu(c);
      setMem(m);
      setNet(n);
      setCpuHist((h) => [...h.slice(1), c]);
      setMemHist((h) => [...h.slice(1), m]);
      setProcs((ps) =>
        ps.map((p) => ({ ...p, cpu: jitter(p.cpu, 4, 0, 40), mem: jitter(p.mem, 2, 0, 30) })),
      );
    }, 1200);
    return () => clearInterval(t);
  }, [cpu, mem, net]);

  return (
    <div className="flex h-full flex-col bg-window">
      <div className="flex border-b border-white/5 bg-black/20 px-2">
        {(["processes", "resources", "filesystems"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition ${
              tab === t
                ? "border-b-2 border-primary text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "processes" && (
        <div className="scrollbar-thin flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/40 text-left text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-3 py-2 font-normal">PID</th>
                <th className="px-3 py-2 font-normal">Process</th>
                <th className="px-3 py-2 font-normal">User</th>
                <th className="px-3 py-2 font-normal">State</th>
                <th className="px-3 py-2 text-right font-normal">CPU %</th>
                <th className="px-3 py-2 text-right font-normal">Mem %</th>
              </tr>
            </thead>
            <tbody>
              {procs
                .slice()
                .sort((a, b) => b.cpu - a.cpu)
                .map((p) => (
                  <tr key={p.pid} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-3 py-1.5 font-mono text-xs text-white/70">{p.pid}</td>
                    <td className="px-3 py-1.5 text-white/90">{p.name}</td>
                    <td className="px-3 py-1.5 text-white/60">{p.user}</td>
                    <td className="px-3 py-1.5 text-white/60">{p.state}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/80">
                      {p.cpu.toFixed(1)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/80">
                      {p.mem.toFixed(1)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "resources" && (
        <div className="scrollbar-thin flex-1 space-y-5 overflow-auto p-4">
          <ResourceCard
            icon={Cpu}
            label="CPU"
            value={`${cpu.toFixed(0)}%`}
            hist={cpuHist}
            color="oklch(0.65 0.19 35)"
          />
          <ResourceCard
            icon={MemoryStick}
            label="Memory"
            value={`${mem.toFixed(0)}% (${((mem / 100) * 8).toFixed(1)} / 8.0 GB)`}
            hist={memHist}
            color="oklch(0.60 0.22 300)"
          />
          <div className="rounded-lg border border-white/5 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Network className="h-4 w-4 text-accent-teal" />
              <span className="font-medium">Network</span>
              <span className="ml-auto text-white/60">{net.toFixed(1)} Mbps</span>
            </div>
            <div className="flex gap-4 text-xs text-white/60">
              <span>↓ {(net * 0.8).toFixed(1)} Mbps</span>
              <span>↑ {(net * 0.3).toFixed(1)} Mbps</span>
            </div>
          </div>
        </div>
      )}

      {tab === "filesystems" && (
        <div className="scrollbar-thin flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {[
              { name: "/", type: "ext4", used: 42, total: 128 },
              { name: "/home", type: "ext4", used: 68, total: 256 },
              { name: "/boot", type: "vfat", used: 0.5, total: 1 },
            ].map((fs) => (
              <div key={fs.name} className="rounded-lg border border-white/5 bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-accent-orange" />
                  <span className="font-mono">{fs.name}</span>
                  <span className="text-xs text-white/50">{fs.type}</span>
                  <span className="ml-auto text-white/70">
                    {fs.used} / {fs.total} GB
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(fs.used / fs.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({
  icon: Icon,
  label,
  value,
  hist,
  color,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  hist: number[];
  color: string;
}) {
  const w = 400;
  const h = 80;
  const max = 100;
  const step = w / (hist.length - 1);
  const points = hist.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;

  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-white/70">{value}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
        <polygon points={area} fill={color} fillOpacity={0.2} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
    </div>
  );
}
