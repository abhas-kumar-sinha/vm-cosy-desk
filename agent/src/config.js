import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_CONFIG_PATH = "/etc/lovable-os/config.json";

export function loadConfig() {
  const configPath = process.env.LOVABLE_OS_CONFIG ?? DEFAULT_CONFIG_PATH;
  let file = {};
  if (fs.existsSync(configPath)) {
    try {
      file = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      console.warn(`Failed to parse ${configPath}: ${e.message}`);
    }
  }

  const port = Number(process.env.PORT ?? file.port ?? 8080);
  const host = process.env.HOST ?? file.host ?? "127.0.0.1";
  const sessionSecret =
    process.env.LOVABLE_OS_SESSION_SECRET ??
    file.sessionSecret ??
    crypto.randomBytes(32).toString("hex");
  const allowedUsers = file.allowedUsers ?? null; // null = any PAM-accepted user
  const uploadDir = file.uploadDir ?? path.join(os.tmpdir(), "lovable-os-uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  return {
    port,
    host,
    sessionSecret,
    allowedUsers,
    uploadDir,
    sessionCookie: "lovable_os_session",
    sessionTtlMs: 12 * 60 * 60 * 1000,
  };
}
