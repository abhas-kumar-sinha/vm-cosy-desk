import express from "express";
import fs from "node:fs";

const SOCKET = "/var/run/docker.sock";

async function getDocker() {
  if (!fs.existsSync(SOCKET)) return null;
  const { default: Docker } = await import("dockerode");
  return new Docker({ socketPath: SOCKET });
}

export function dockerRouter(_config) {
  const router = express.Router();

  router.get("/status", async (_req, res) => {
    const d = await getDocker().catch(() => null);
    if (!d) return res.json({ available: false });
    try {
      const info = await d.info();
      res.json({ available: true, containers: info.Containers, images: info.Images, version: info.ServerVersion });
    } catch (e) {
      res.json({ available: false, error: e.message });
    }
  });

  router.get("/containers", async (_req, res) => {
    const d = await getDocker();
    if (!d) return res.status(503).json({ error: "docker_unavailable" });
    try {
      const list = await d.listContainers({ all: true });
      res.json({
        containers: list.map((c) => ({
          id: c.Id.slice(0, 12),
          name: c.Names?.[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12),
          image: c.Image,
          state: c.State,
          status: c.Status,
        })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/containers/:id/:action(start|stop|restart)", async (req, res) => {
    const d = await getDocker();
    if (!d) return res.status(503).json({ error: "docker_unavailable" });
    try {
      const c = d.getContainer(req.params.id);
      await c[req.params.action]();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/containers/:id/logs", async (req, res) => {
    const d = await getDocker();
    if (!d) return res.status(503).json({ error: "docker_unavailable" });
    try {
      const c = d.getContainer(req.params.id);
      const stream = await c.logs({ stdout: true, stderr: true, tail: 300, follow: true });
      res.setHeader("Content-Type", "text/plain");
      stream.on("data", (buf) => res.write(buf.toString("utf8")));
      req.on("close", () => { try { stream.destroy(); } catch {} });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
