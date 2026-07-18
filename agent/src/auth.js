import express from "express";
import crypto from "node:crypto";
import { userInfo } from "node:os";

// In-memory session store. Signed with HMAC so tampering is detectable.
const sessions = new Map();

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}

function makeToken(secret) {
  const id = crypto.randomBytes(24).toString("hex");
  const sig = sign(id, secret);
  return `${id}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return null;
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const expected = sign(id, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

async function pamAuth(username, password) {
  // authenticate-pam is optional — if it fails to build (dev/mac), fall back
  // to the current process user for a smoke test.
  try {
    const mod = await import("authenticate-pam");
    const pam = mod.default ?? mod;
    return await new Promise((resolve) => {
      pam.authenticate(username, password, (err) => resolve(!err));
    });
  } catch {
    const me = userInfo();
    return username === me.username && password === "dev";
  }
}

function lookupUnixUser(username) {
  // Resolve uid/gid without shelling out. Requires the process to have read
  // access to /etc/passwd (root always does).
  try {
    const passwd = require("node:fs").readFileSync("/etc/passwd", "utf8");
    for (const line of passwd.split("\n")) {
      const [name, , uid, gid, , home, shell] = line.split(":");
      if (name === username) {
        return { uid: Number(uid), gid: Number(gid), home, shell: shell || "/bin/bash" };
      }
    }
  } catch {}
  const me = userInfo();
  return { uid: me.uid, gid: me.gid, home: me.homedir, shell: me.shell || "/bin/bash" };
}

export function attachSession(config) {
  return (req, _res, next) => {
    const token = req.cookies?.[config.sessionCookie];
    const id = verifyToken(token, config.sessionSecret);
    if (id) {
      const s = sessions.get(id);
      if (s && s.expiresAt > Date.now()) {
        req.session = s;
      } else if (s) {
        sessions.delete(id);
      }
    }
    next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.session) return res.status(401).json({ error: "not_authenticated" });
  next();
}

export function authRouter(config) {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) return res.status(400).json({ error: "missing_credentials" });
    if (config.allowedUsers && !config.allowedUsers.includes(username)) {
      return res.status(403).json({ error: "user_not_allowed" });
    }
    const ok = await pamAuth(username, password);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    const token = makeToken(config.sessionSecret);
    const [id] = token.split(".");
    const unix = lookupUnixUser(username);
    const session = {
      id,
      username,
      uid: unix.uid,
      gid: unix.gid,
      home: unix.home,
      shell: unix.shell,
      expiresAt: Date.now() + config.sessionTtlMs,
    };
    sessions.set(id, session);
    res.cookie(config.sessionCookie, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure,
      maxAge: config.sessionTtlMs,
      path: "/",
    });
    res.json({ username, home: unix.home });
  });

  router.post("/logout", (req, res) => {
    const token = req.cookies?.[config.sessionCookie];
    const id = verifyToken(token, config.sessionSecret);
    if (id) sessions.delete(id);
    res.clearCookie(config.sessionCookie, { path: "/" });
    res.json({ ok: true });
  });

  router.get("/me", (req, res) => {
    if (!req.session) return res.status(401).json({ error: "not_authenticated" });
    const { username, home, uid, gid } = req.session;
    res.json({ username, home, uid, gid });
  });

  return router;
}

export function getSessionFromToken(token, config) {
  const id = verifyToken(token, config.sessionSecret);
  if (!id) return null;
  const s = sessions.get(id);
  if (!s || s.expiresAt <= Date.now()) return null;
  return s;
}
