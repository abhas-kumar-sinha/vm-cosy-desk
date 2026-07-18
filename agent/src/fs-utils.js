import path from "node:path";
import fs from "node:fs";

// Resolve a request path against the session user's roots. Prevents
// path traversal by requiring the resolved absolute path to live under one
// of the allowed roots.
export function resolveSafePath(session, requested) {
  const allowedRoots = session.uid === 0 ? ["/"] : [session.home, "/tmp", "/var/log"];
  const target = path.resolve(requested || session.home);
  const real = fs.existsSync(target) ? fs.realpathSync(target) : target;
  const ok = allowedRoots.some((r) => real === r || real.startsWith(r.endsWith("/") ? r : r + "/"));
  if (!ok) {
    const err = new Error("path_forbidden");
    err.status = 403;
    throw err;
  }
  return real;
}

export function safeStat(p) {
  try {
    const s = fs.statSync(p);
    return {
      size: s.size,
      mtime: s.mtimeMs,
      mode: s.mode,
      isDir: s.isDirectory(),
      isFile: s.isFile(),
      isSymlink: s.isSymbolicLink(),
    };
  } catch {
    return null;
  }
}
