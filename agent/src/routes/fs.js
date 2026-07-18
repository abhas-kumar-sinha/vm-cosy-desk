import express from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import mime from "mime-types";
import { resolveSafePath, safeStat } from "../fs-utils.js";

export function fsRouter(_config) {
  const router = express.Router();

  router.get("/list", async (req, res) => {
    try {
      const abs = resolveSafePath(req.session, req.query.path);
      const entries = await fsp.readdir(abs, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async (e) => {
          const full = path.join(abs, e.name);
          const st = safeStat(full);
          return {
            name: e.name,
            path: full,
            isDir: e.isDirectory(),
            isSymlink: e.isSymbolicLink(),
            size: st?.size ?? 0,
            mtime: st?.mtime ?? 0,
            mime: e.isDirectory() ? "inode/directory" : mime.lookup(e.name) || "application/octet-stream",
          };
        }),
      );
      items.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
      res.json({ path: abs, items });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/read", async (req, res) => {
    try {
      const abs = resolveSafePath(req.session, req.query.path);
      const st = fs.statSync(abs);
      if (st.size > 5 * 1024 * 1024) return res.status(413).json({ error: "too_large_use_download" });
      const text = await fsp.readFile(abs, "utf8");
      res.json({ path: abs, text, size: st.size, mtime: st.mtimeMs });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.get("/download", (req, res) => {
    try {
      const abs = resolveSafePath(req.session, req.query.path);
      const st = fs.statSync(abs);
      if (st.isDirectory()) return res.status(400).json({ error: "is_directory" });
      const type = mime.lookup(abs) || "application/octet-stream";
      const range = req.headers.range;
      res.setHeader("Content-Type", type);
      res.setHeader("Accept-Ranges", "bytes");
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m?.[1] ? parseInt(m[1], 10) : 0;
        const end = m?.[2] ? parseInt(m[2], 10) : st.size - 1;
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${st.size}`);
        res.setHeader("Content-Length", end - start + 1);
        fs.createReadStream(abs, { start, end }).pipe(res);
      } else {
        res.setHeader("Content-Length", st.size);
        if (req.query.attachment === "1") {
          res.setHeader("Content-Disposition", `attachment; filename="${path.basename(abs)}"`);
        }
        fs.createReadStream(abs).pipe(res);
      }
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/write", async (req, res) => {
    try {
      const abs = resolveSafePath(req.session, req.body?.path);
      await fsp.writeFile(abs, req.body?.text ?? "", "utf8");
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/mkdir", async (req, res) => {
    try {
      const abs = resolveSafePath(req.session, req.body?.path);
      await fsp.mkdir(abs, { recursive: true });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/rename", async (req, res) => {
    try {
      const from = resolveSafePath(req.session, req.body?.from);
      const to = resolveSafePath(req.session, req.body?.to);
      await fsp.rename(from, to);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.delete("/rm", async (req, res) => {
    try {
      const abs = resolveSafePath(req.session, req.query?.path);
      await fsp.rm(abs, { recursive: true, force: true });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  return router;
}
