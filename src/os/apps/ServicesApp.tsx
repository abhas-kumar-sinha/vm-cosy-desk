import { useEffect, useRef, useState } from "react";
import { agent } from "@/lib/agent";
import { Play, Square, RefreshCw, Search, X } from "lucide-react";

interface Svc { name: string; load: string; active: string; sub: string; description: string }

export function ServicesApp() {
  const [services, setServices] = useState<Svc[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [logsOpen, setLogsOpen] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const load = () => agent.services.list().then((r) => setServices(r.services)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const action = async (name: string, act: "start" | "stop" | "restart") => {
    try { await agent.services.action(name, act); load(); }
    catch (e) { alert((e as Error).message); }
  };

  const openLogs = (name: string) => {
    setLogsOpen(name); setLogs([]);
    esRef.current?.close();
    const es = new EventSource(`/api/services/${encodeURIComponent(name)}/logs`);
    esRef.current = es;
    es.onmessage = (ev) => setLogs((l) => [...l.slice(-500), JSON.parse(ev.data)]);
  };
  const closeLogs = () => { esRef.current?.close(); esRef.current = null; setLogsOpen(null); };
  useEffect(() => () => esRef.current?.close(), []);

  const filtered = services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex h-full flex-col bg-window text-window-foreground">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
        <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1">
          <Search className="h-3.5 w-3.5 text-white/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter services…" className="w-64 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none" />
        </div>
        <div className="flex-1" />
        <button onClick={load} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
      </div>
      {err && <div className="border-b border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">{err}</div>}
      <div className="scrollbar-thin flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-black/60 text-left text-white/50">
            <tr>
              <th className="px-3 py-1.5 font-normal">Service</th>
              <th className="px-3 py-1.5 font-normal">Load</th>
              <th className="px-3 py-1.5 font-normal">Active</th>
              <th className="px-3 py-1.5 font-normal">Sub</th>
              <th className="px-3 py-1.5 font-normal">Description</th>
              <th className="px-3 py-1.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.name} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-3 py-1 font-mono">{s.name}</td>
                <td className="px-3 py-1 text-white/70">{s.load}</td>
                <td className={`px-3 py-1 ${s.active === "active" ? "text-emerald-300" : "text-white/50"}`}>{s.active}</td>
                <td className="px-3 py-1 text-white/60">{s.sub}</td>
                <td className="px-3 py-1 text-white/60">{s.description}</td>
                <td className="whitespace-nowrap px-3 py-1 text-right">
                  <button onClick={() => action(s.name, "start")} title="Start" className="rounded p-1 text-emerald-300 hover:bg-emerald-500/20"><Play className="h-3 w-3" /></button>
                  <button onClick={() => action(s.name, "restart")} title="Restart" className="rounded p-1 text-sky-300 hover:bg-sky-500/20"><RefreshCw className="h-3 w-3" /></button>
                  <button onClick={() => action(s.name, "stop")} title="Stop" className="rounded p-1 text-red-300 hover:bg-red-500/20"><Square className="h-3 w-3" /></button>
                  <button onClick={() => openLogs(s.name)} className="ml-1 rounded px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10">Logs</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logsOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/85 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-sm">
            <span className="font-mono">journalctl -fu {logsOpen}</span>
            <button onClick={closeLogs} className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
