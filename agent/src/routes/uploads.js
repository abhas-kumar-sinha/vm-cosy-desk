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
    async onUploadFinish(req, res, upload) {
      try {
        const targetDir = req.headers["x-target-dir"];
        const filename = upload.metadata?.filename ?? upload.id;
        if (!req.session || !targetDir) return res;
        const dir = resolveSafePath(req.session, String(targetDir));
        await fsp.mkdir(dir, { recursive: true });
        const dest = path.join(dir, filename);
        const src = path.join(config.uploadDir, upload.id);
        await fsp.rename(src, dest).catch(async () => {
          // cross-device fallback
          await fsp.copyFile(src, dest);
          await fsp.unlink(src);
        });
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
