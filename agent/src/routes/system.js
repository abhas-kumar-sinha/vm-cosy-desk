import express from "express";
import fs from "node:fs";
import os from "node:os";
import { execFile } from "node:child_process";

function readProc(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return ""; }
}

function cpuTotals() {
  const t = readProc("/proc/stat").split("\n")[0].trim().split(/\s+/).slice(1).map(Number);
  const idle = t[3] + (t[4] ?? 0);
  const total = t.reduce((a, b) => a + b, 0);
  return { idle, total };
}

let lastCpu = cpuTotals();

function readMemInfo() {
  const info = {};
  for (const line of readProc("/proc/meminfo").split("\n")) {
    const [k, v] = line.split(":");
    if (v) info[k.trim()] = parseInt(v.trim(), 10) * 1024;
  }
  return info;
}

function readLoadAvg() {
  return os.loadavg();
}

function readNet() {
  const lines = readProc("/proc/net/dev").split("\n").slice(2);
  let rx = 0, tx = 0;
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 10) continue;
    const iface = parts[0].replace(":", "");
    if (iface === "lo") continue;
    rx += parseInt(parts[1], 10) || 0;
    tx += parseInt(parts[9], 10) || 0;
  }
  return { rx, tx };
}

export function systemRouter(_config) {
  const router = express.Router();

  router.get("/info", (_req, res) => {
    const mem = readMemInfo();
    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      uptime: os.uptime(),
      cpus: os.cpus().map((c) => ({ model: c.model, speed: c.speed })),
      totalMem: mem.MemTotal ?? os.totalmem(),
      freeMem: mem.MemAvailable ?? os.freemem(),
    });
  });

  router.get("/stats", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let lastNet = readNet();
    const tick = () => {
      const now = cpuTotals();
      const idleDelta = now.idle - lastCpu.idle;
      const totalDelta = now.total - lastCpu.total;
      const cpu = totalDelta > 0 ? 1 - idleDelta / totalDelta : 0;
      lastCpu = now;
      const mem = readMemInfo();
      const memTotal = mem.MemTotal ?? os.totalmem();
      const memUsed = memTotal - (mem.MemAvailable ?? os.freemem());
      const net = readNet();
      const payload = {
        t: Date.now(),
        cpu,
        mem: { total: memTotal, used: memUsed },
        load: readLoadAvg(),
        net: { rxPs: Math.max(0, net.rx - lastNet.rx), txPs: Math.max(0, net.tx - lastNet.tx) },
      };
      lastNet = net;
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    const iv = setInterval(tick, 1000);
    tick();
    req.on("close", () => clearInterval(iv));
  });

  router.get("/processes", (_req, res) => {
    execFile("ps", ["-eo", "pid,user,pcpu,pmem,comm", "--sort=-pcpu"], { maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) return res.status(500).json({ error: err.message });
      const lines = stdout.trim().split("\n");
      lines.shift();
      const procs = lines.slice(0, 200).map((l) => {
        const [pid, user, cpu, mem, ...comm] = l.trim().split(/\s+/);
        return { pid: Number(pid), user, cpu: Number(cpu), mem: Number(mem), comm: comm.join(" ") };
      });
      res.json({ processes: procs });
    });
  });

  router.post("/kill", (req, res) => {
    const pid = Number(req.body?.pid);
    const signal = req.body?.signal || "SIGTERM";
    if (!pid) return res.status(400).json({ error: "missing_pid" });
    try {
      process.kill(pid, signal);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
