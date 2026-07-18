import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import { ptyWsUrl } from "@/lib/agent";

export function TerminalApp() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      fontSize: 13,
      cursorBlink: true,
      theme: {
        background: "#0b0f19",
        foreground: "#e5e7eb",
        cursor: "#f97316",
        selectionBackground: "#334155",
      },
      allowProposedApi: true,
      convertEol: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(hostRef.current);
    fit.fit();

    const ws = new WebSocket(ptyWsUrl());
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.type === "data") term.write(m.data);
        else if (m.type === "error") term.writeln(`\x1b[31m[agent] ${m.error}\x1b[0m`);
        else if (m.type === "exit") term.writeln(`\r\n\x1b[33m[exit ${m.exitCode}]\x1b[0m`);
      } catch {}
    };
    ws.onerror = () => term.writeln("\x1b[31m[disconnected]\x1b[0m");
    ws.onclose = () => term.writeln("\r\n\x1b[33m[connection closed]\x1b[0m");

    const disp = term.onData((data) => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: "input", data }));
    });

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      } catch {}
    });
    ro.observe(hostRef.current);

    return () => {
      disp.dispose();
      ro.disconnect();
      try { ws.close(); } catch {}
      term.dispose();
    };
  }, []);

  return <div ref={hostRef} className="h-full w-full bg-[#0b0f19] p-2" />;
}
