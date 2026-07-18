// Typed HTTP + WS client that talks to the LovableOS agent running on the VM.
// All calls are same-origin: the agent serves the built web bundle and the
// browser hits /api/* + /ws/* against the same host. In the Lovable preview
// (no agent), every call rejects and ConnectionGate shows install docs.

export interface FsEntry {
  name: string;
  path: string;
  isDir: boolean;
  isSymlink: boolean;
  size: number;
  mtime: number;
  mime: string;
}

export interface AgentSession {
  username: string;
  home: string;
  uid: number;
  gid: number;
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const agent = {
  async health(signal?: AbortSignal): Promise<{ ok: true; version: string }> {
    const res = await fetch("/api/health", { signal, credentials: "same-origin" });
    return j(res);
  },
  auth: {
    me: () => fetch("/api/auth/me", { credentials: "same-origin" }).then(j<AgentSession>),
    login: (username: string, password: string) =>
      fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }).then(j<{ username: string; home: string }>),
    logout: () =>
      fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).then(j<{ ok: true }>),
  },
  fs: {
    list: (path: string) =>
      fetch(`/api/fs/list?path=${encodeURIComponent(path)}`, { credentials: "same-origin" }).then(
        j<{ path: string; items: FsEntry[] }>,
      ),
    read: (path: string) =>
      fetch(`/api/fs/read?path=${encodeURIComponent(path)}`, { credentials: "same-origin" }).then(
        j<{ path: string; text: string; size: number; mtime: number }>,
      ),
    write: (path: string, text: string) =>
      fetch("/api/fs/write", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, text }),
      }).then(j<{ ok: true }>),
    mkdir: (path: string) =>
      fetch("/api/fs/mkdir", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }).then(j<{ ok: true }>),
    rename: (from: string, to: string) =>
      fetch("/api/fs/rename", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      }).then(j<{ ok: true }>),
    remove: (path: string) =>
      fetch(`/api/fs/rm?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
        credentials: "same-origin",
      }).then(j<{ ok: true }>),
    downloadUrl: (path: string, attachment = false) =>
      `/api/fs/download?path=${encodeURIComponent(path)}${attachment ? "&attachment=1" : ""}`,
  },
  system: {
    info: () =>
      fetch("/api/system/info", { credentials: "same-origin" }).then(
        j<{
          hostname: string;
          platform: string;
          release: string;
          arch: string;
          uptime: number;
          cpus: { model: string; speed: number }[];
          totalMem: number;
          freeMem: number;
        }>,
      ),
    processes: () =>
      fetch("/api/system/processes", { credentials: "same-origin" }).then(
        j<{ processes: { pid: number; user: string; cpu: number; mem: number; comm: string }[] }>,
      ),
    kill: (pid: number, signal = "SIGTERM") =>
      fetch("/api/system/kill", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, signal }),
      }).then(j<{ ok: true }>),
  },
  services: {
    list: () =>
      fetch("/api/services", { credentials: "same-origin" }).then(
        j<{
          services: { name: string; load: string; active: string; sub: string; description: string }[];
        }>,
      ),
    action: (name: string, action: "start" | "stop" | "restart") =>
      fetch(`/api/services/${encodeURIComponent(name)}/${action}`, {
        method: "POST",
        credentials: "same-origin",
      }).then(j<{ ok: true }>),
  },
  docker: {
    status: () =>
      fetch("/api/docker/status", { credentials: "same-origin" }).then(
        j<{ available: boolean; containers?: number; images?: number; version?: string }>,
      ),
    containers: () =>
      fetch("/api/docker/containers", { credentials: "same-origin" }).then(
        j<{
          containers: { id: string; name: string; image: string; state: string; status: string }[];
        }>,
      ),
    action: (id: string, action: "start" | "stop" | "restart") =>
      fetch(`/api/docker/containers/${id}/${action}`, {
        method: "POST",
        credentials: "same-origin",
      }).then(j<{ ok: true }>),
  },
};

export function ptyWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/pty`;
}
