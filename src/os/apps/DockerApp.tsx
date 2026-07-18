import { useEffect, useState } from "react";
import { agent } from "@/lib/agent";
import { Play, Square, RefreshCw, Container, X } from "lucide-react";

interface C { id: string; name: string; image: string; state: string; status: string }

export function DockerApp() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [containers, setContainers] = useState<C[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState("");

  const load = async () => {
    try {
      const s = await agent.docker.status();
      setAvailable(s.available);
      if (s.available) {
        const r = await agent.docker.containers();
        setContainers(r.containers);
      }
    } catch (e) { setErr((e as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const action = async (id: string, act: "start" | "stop" | "restart") => {
    try { await agent.docker.action(id, act); load(); }
    catch (e) { alert((e as Error).message); }
  };

  const openLogs = async (id: string) => {
    setLogsFor(id); setLogs("");
    const res = await fetch(`/api/docker/containers/${id}/logs`, { credentials: "same-origin" });
    if (!res.body) return;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setLogs((l) => (l + dec.decode(value)).slice(-30000));
      if (logsFor !== id) break;
    }
  };

  if (available === false) {
    return (
      <div className="grid h-full place-items-center bg-window text-window-foreground">
        <div className="text-center text-sm text-white/60">
          <Container className="mx-auto mb-3 h-10 w-10 text-white/30" />
          Docker daemon socket not available at <code>/var/run/docker.sock</code>.
          <div className="mt-2 text-xs text-white/40">Install Docker and add your user to the <code>docker</code> group.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-window text-window-foreground">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
        <Container className="h-4 w-4 text-cyan-400" />
        <span className="text-sm">Containers</span>
        <div className="flex-1" />
        <button onClick={load} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
      </div>
      {err && <div className="border-b border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">{err}</div>}
      <div className="scrollbar-thin flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-black/60 text-left text-white/50">
            <tr>
              <th className="px-3 py-1.5 font-normal">Name</th>
              <th className="px-3 py-1.5 font-normal">Image</th>
              <th className="px-3 py-1.5 font-normal">State</th>
              <th className="px-3 py-1.5 font-normal">Status</th>
              <th className="px-3 py-1.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {containers.map((c) => (
              <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-3 py-1 font-mono">{c.name}</td>
                <td className="px-3 py-1 text-white/70">{c.image}</td>
                <td className={`px-3 py-1 ${c.state === "running" ? "text-emerald-300" : "text-white/50"}`}>{c.state}</td>
                <td className="px-3 py-1 text-white/60">{c.status}</td>
                <td className="whitespace-nowrap px-3 py-1 text-right">
                  <button onClick={() => action(c.id, "start")} className="rounded p-1 text-emerald-300 hover:bg-emerald-500/20"><Play className="h-3 w-3" /></button>
                  <button onClick={() => action(c.id, "restart")} className="rounded p-1 text-sky-300 hover:bg-sky-500/20"><RefreshCw className="h-3 w-3" /></button>
                  <button onClick={() => action(c.id, "stop")} className="rounded p-1 text-red-300 hover:bg-red-500/20"><Square className="h-3 w-3" /></button>
                  <button onClick={() => openLogs(c.id)} className="ml-1 rounded px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10">Logs</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logsFor && (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/85 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-sm">
            <span className="font-mono">docker logs {logsFor}</span>
            <button onClick={() => setLogsFor(null)} className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <pre className="scrollbar-thin flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-[11px] leading-relaxed text-emerald-200">{logs}</pre>
        </div>
      )}
    </div>
  );
}
