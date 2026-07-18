import express from "express";
import { execFile, spawn } from "node:child_process";

export function servicesRouter(_config) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    execFile(
      "systemctl",
      ["list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"],
      { maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return res.status(500).json({ error: err.message });
        const services = stdout
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [name, load, active, sub, ...desc] = line.trim().split(/\s+/);
            return { name, load, active, sub, description: desc.join(" ") };
          });
        res.json({ services });
      },
    );
  });

  router.post("/:name/:action(start|stop|restart)", (req, res) => {
    const { name, action } = req.params;
    execFile("sudo", ["-n", "systemctl", action, name], (err, _stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr || err.message });
      res.json({ ok: true });
    });
  });

  router.get("/:name/logs", (req, res) => {
    const { name } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders?.();
    const proc = spawn("journalctl", ["-fu", name, "-n", "200", "--no-pager"]);
    proc.stdout.on("data", (buf) => {
      for (const line of buf.toString("utf8").split("\n")) {
        if (line) res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    });
    proc.stderr.on("data", (buf) => {
      res.write(`data: ${JSON.stringify(`[err] ${buf.toString("utf8")}`)}\n\n`);
    });
    req.on("close", () => proc.kill());
  });

  return router;
}
