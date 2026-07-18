import { useEffect, useRef, useState } from "react";
import { agent } from "@/lib/agent";
import { Cpu, MemoryStick, Network, Activity, Zap } from "lucide-react";

interface Stat { t: number; cpu: number; mem: { total: number; used: number }; load: number[]; net: { rxPs: number; txPs: number } }
interface Proc { pid: number; user: string; cpu: number; mem: number; comm: string }
interface Info { hostname: string; platform: string; release: string; arch: string; uptime: number; cpus: { model: string; speed: number }[]; totalMem: number; freeMem: number }

const MAX = 60;

function fmtBytes(n: number) { const u = ["B","KB","MB","GB","TB"]; let i=0,x=n; while(x>=1024&&i<u.length-1){x/=1024;i++;} return `${x.toFixed(1)} ${u[i]}`; }
function fmtRate(n: number) { return `${fmtBytes(n)}/s`; }

export function MonitorApp() {
  const [info, setInfo] = useState<Info | null>(null);
  const [history, setHistory] = useState<Stat[]>([]);
  const [procs, setProcs] = useState<Proc[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    agent.system.info().then(setInfo).catch((e) => setErr(e.message));
    const es = new EventSource("/api/system/stats");
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const s: Stat = JSON.parse(ev.data);
        setHistory((h) => [...h.slice(-MAX + 1), s]);
      } catch {}
    };
    es.onerror = () => setErr("Live stream disconnected");
    const iv = setInterval(() => { agent.system.processes().then((r) => setProcs(r.processes)).catch(() => {}); }, 3000);
    agent.system.processes().then((r) => setProcs(r.processes)).catch(() => {});
    return () => { es.close(); clearInterval(iv); };
  }, []);

  const last = history[history.length - 1];
  const kill = async (pid: number) => {
    if (!confirm(`Send SIGTERM to PID ${pid}?`)) return;
    try { await agent.system.kill(pid); } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="scrollbar-thin h-full overflow-auto bg-window p-4 text-window-foreground">
      {err && <div className="mb-3 rounded bg-red-500/20 px-3 py-2 text-xs text-red-200">{err}</div>}
      {info && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat_ icon={Cpu} label="Host" value={info.hostname} sub={`${info.platform} ${info.release}`} />
          <Stat_ icon={Zap} label="CPU" value={`${info.cpus.length} × ${(info.cpus[0]?.speed ?? 0)} MHz`} sub={info.cpus[0]?.model?.split(" ").slice(0, 4).join(" ")} />
          <Stat_ icon={MemoryStick} label="Memory" value={fmtBytes(info.totalMem)} sub={`${fmtBytes(info.totalMem - info.freeMem)} used`} />
          <Stat_ icon={Activity} label="Uptime" value={`${Math.floor(info.uptime / 3600)}h`} sub={`load ${last?.load?.[0]?.toFixed(2) ?? "…"}`} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="CPU" color="oklch(0.7 0.2 30)" values={history.map((h) => h.cpu * 100)} suffix="%" max={100} />
        <ChartCard title="Memory" color="oklch(0.7 0.2 260)" values={history.map((h) => (h.mem.used / h.mem.total) * 100)} suffix="%" max={100} />
        <ChartCard title="Network RX" color="oklch(0.7 0.2 145)" values={history.map((h) => h.net.rxPs)} format={fmtRate} />
        <ChartCard title="Network TX" color="oklch(0.7 0.2 300)" values={history.map((h) => h.net.txPs)} format={fmtRate} />
      </div>

      <div className="mt-4 rounded-lg border border-white/5 bg-black/20">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2 text-xs font-medium text-white/70">
          <Network className="h-3.5 w-3.5" /> Top processes (by CPU)
        </div>
        <div className="scrollbar-thin max-h-72 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-black/60 text-left text-white/50">
              <tr>
                <th className="px-3 py-1.5 font-normal">PID</th>
                <th className="px-3 py-1.5 font-normal">User</th>
                <th className="px-3 py-1.5 font-normal">CPU%</th>
                <th className="px-3 py-1.5 font-normal">MEM%</th>
                <th className="px-3 py-1.5 font-normal">Command</th>
                <th className="px-3 py-1.5 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {procs.slice(0, 40).map((p) => (
                <tr key={p.pid} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-1 tabular-nums">{p.pid}</td>
                  <td className="px-3 py-1">{p.user}</td>
                  <td className="px-3 py-1 tabular-nums text-amber-300">{p.cpu.toFixed(1)}</td>
                  <td className="px-3 py-1 tabular-nums text-sky-300">{p.mem.toFixed(1)}</td>
                  <td className="px-3 py-1 font-mono">{p.comm}</td>
                  <td className="px-3 py-1 text-right">
                    <button onClick={() => kill(p.pid)} className="rounded px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/20">Kill</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat_({ icon: Icon, label, value, sub }: { icon: typeof Cpu; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/50"><Icon className="h-3 w-3" />{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
      {sub && <div className="truncate text-[11px] text-white/50">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, color, values, suffix, max, format }: { title: string; color: string; values: number[]; suffix?: string; max?: number; format?: (n: number) => string }) {
  const w = 300, h = 80;
  const localMax = max ?? Math.max(1, ...values);
  const points = values
    .map((v, i) => `${(i / Math.max(1, MAX - 1)) * w},${h - (v / localMax) * h}`)
    .join(" ");
  const last = values[values.length - 1] ?? 0;
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-white/70">{title}</span>
        <span className="tabular-nums" style={{ color }}>
          {format ? format(last) : `${last.toFixed(1)}${suffix ?? ""}`}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
        <defs>
          <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {values.length > 1 && (
          <>
            <polyline fill={`url(#g-${title})`} stroke="none" points={`0,${h} ${points} ${w},${h}`} />
            <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
          </>
        )}
      </svg>
    </div>
  );
}
