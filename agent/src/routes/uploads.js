import express from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Server as TusServer } from "@tus/server";
import { FileStore } from "@tus/file-store";
import { resolveSafePath } from "../fs-utils.js";

export function uploadsRouter(config) {
  const router = express.Router();

  const tus = new TusServer({
    path: "/api/uploads",
    datastore: new FileStore({ directory: config.uploadDir }),
    respectForwardedHeaders: true,
    // 30 GB per file — large enough for a full ISO / mkv.
    maxSize: 30 * 1024 * 1024 * 1024,
    async onUploadFinish(req, res, upload) {
      try {
        // Read target dir from tus metadata (survives every PATCH) — headers
        // are unreliable across resumable chunks.
        const targetDir = upload.metadata?.targetDir;
        const filename = upload.metadata?.filename ?? upload.id;
        if (!req.session) {
          console.warn("upload finished without session");
          return res;
        }
        if (!targetDir) {
          console.warn("upload finished without targetDir metadata");
          return res;
        }
        const dir = resolveSafePath(req.session, String(targetDir));
        await fsp.mkdir(dir, { recursive: true });
        const dest = path.join(dir, filename);
        const src = path.join(config.uploadDir, upload.id);
        // Set ownership to logged-in user before moving into their tree.
        try { await fsp.chown(src, req.session.uid, req.session.gid); } catch {}
        await fsp.rename(src, dest).catch(async () => {
          // cross-device fallback (uploads dir on a different mount)
          await fsp.copyFile(src, dest);
          await fsp.unlink(src);
        });
        try { await fsp.chown(dest, req.session.uid, req.session.gid); } catch {}
        // remove tus json sidecar
        fs.promises.unlink(src + ".json").catch(() => {});
      } catch (e) {
        console.error("upload finalize failed", e);
      }
      return res;
    },
  });

  router.all("*", (req, res) => tus.handle(req, res));
  return router;
}
