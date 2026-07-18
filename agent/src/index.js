// LovableOS Agent — Node.js server that runs on your Ubuntu/Debian VM.
// Serves the built React desktop and exposes real filesystem, PTY, /proc,
// systemctl and Docker to the browser over HTTP + WebSocket.

import express from "express";
import cookieParser from "cookie-parser";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

import { loadConfig } from "./config.js";
import { authRouter, requireAuth, attachSession } from "./auth.js";
import { fsRouter } from "./routes/fs.js";
import { uploadsRouter } from "./routes/uploads.js";
import { systemRouter } from "./routes/system.js";
import { servicesRouter } from "./routes/services.js";
import { dockerRouter } from "./routes/docker.js";
import { attachPtyServer } from "./pty.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(attachSession(config));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, agent: "lovable-os", version: "1.0.0", hostname: process.env.HOSTNAME ?? "" });
});

app.use("/api/auth", authRouter(config));
app.use("/api/fs", requireAuth, fsRouter(config));
app.use("/api/uploads", requireAuth, uploadsRouter(config));
app.use("/api/system", requireAuth, systemRouter(config));
app.use("/api/services", requireAuth, servicesRouter(config));
app.use("/api/docker", requireAuth, dockerRouter(config));

// Serve built web bundle (packages/web build output) if present.
const webDist = path.resolve(__dirname, "../../dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api\/|\/ws\/).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).type("text/plain").send(
      "LovableOS agent is running. Build the web bundle (npm --prefix .. run build) to serve the UI.",
    );
  });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/ws/")) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

attachPtyServer(wss, config);

server.listen(config.port, config.host, () => {
  console.log(`LovableOS agent listening on http://${config.host}:${config.port}`);
});
