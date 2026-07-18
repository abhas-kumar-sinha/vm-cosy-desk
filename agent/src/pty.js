import { parse as parseCookie } from "cookie";
import { getSessionFromToken } from "./auth.js";

export function attachPtyServer(wss, config) {
  wss.on("connection", async (ws, req) => {
    if (!req.url?.startsWith("/ws/pty")) return;
    const cookies = parseCookie(req.headers.cookie ?? "");
    const session = getSessionFromToken(cookies[config.sessionCookie], config);
    if (!session) {
      ws.send(JSON.stringify({ type: "error", error: "not_authenticated" }));
      ws.close();
      return;
    }

    let pty;
    try {
      const mod = await import("node-pty");
      pty = mod.default ?? mod;
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", error: "node-pty not installed: " + e.message }));
      ws.close();
      return;
    }

    const term = pty.spawn(session.shell || "/bin/bash", ["-l"], {
      name: "xterm-256color",
      cols: 100,
      rows: 30,
      cwd: session.home,
      uid: process.getuid?.() === 0 ? session.uid : undefined,
      gid: process.getuid?.() === 0 ? session.gid : undefined,
      env: { ...process.env, HOME: session.home, USER: session.username, TERM: "xterm-256color" },
    });

    term.onData((data) => {
      try { ws.send(JSON.stringify({ type: "data", data })); } catch {}
    });
    term.onExit(({ exitCode }) => {
      try { ws.send(JSON.stringify({ type: "exit", exitCode })); ws.close(); } catch {}
    });

    ws.on("message", (buf) => {
      try {
        const msg = JSON.parse(buf.toString("utf8"));
        if (msg.type === "input") term.write(msg.data);
        else if (msg.type === "resize") term.resize(msg.cols, msg.rows);
      } catch {}
    });
    ws.on("close", () => { try { term.kill(); } catch {} });
  });
}
