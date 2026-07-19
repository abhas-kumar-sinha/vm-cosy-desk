
This is a large redesign. Grouping the work into 6 focused streams so I can ship each cleanly.

## 1. Build system: VM-first, not Cloudflare

The Lovable preview is a TanStack Start SSR app targeting Cloudflare Workers — that's why `agent/src/index.js` looks for `../../dist` but never finds it, and why nothing works when git-cloned onto a VM.

Fix:
- Add a new `vite.config.web.ts` (pure React SPA build, no TanStack Start, no nitro) that emits a static bundle to `dist/` — this is what the agent serves. The current `vite.config.ts` stays so the Lovable preview keeps working.
- New root scripts: `build:web` (SPA for the VM) and `build` (Lovable preview, unchanged).
- `install.sh` runs `npm ci && npm run build:web` so the agent gets a real `dist/`.
- `agent/src/index.js` output-dir path fixed to `../dist` (from `agent/src/` that's project-root `/dist`).
- Update README + `NotConnectedScreen` install snippet to the new commands and the real repo URL `github.com/abhas-kumar-sinha/vm-cosy-desk`.

The SPA entry mounts `<ConnectionGate/>` directly — no router needed since there's only one screen.

## 2. Upload pipeline (JSON + 1.4 GB mkv both failed)

Root causes:
- `express.json({ limit: "2mb" })` runs before the tus router and eats the request body on non-JSON POSTs in some cases; also tus needs raw streams — mount tus BEFORE `express.json`.
- Tus `onUploadFinish` uses `req.headers["x-target-dir"]` but the client sends it as a **tus metadata** field on some flows and headers are lost on PATCH continuations. Switch to encoding `targetDir` inside tus `metadata` (base64 per tus spec) which the client already puts on the `Upload-Metadata` header for every chunk.
- Add `maxSize: 20 * 1024 * 1024 * 1024` (20 GB) and confirm `chunkSize` on client stays at 8 MB.
- Auth middleware needs to accept tus's `OPTIONS` + `HEAD` preflights without redirecting to login.
- Frontend `uploadFileTus` fallback currently uses `TextDecoder` on binary buffers — that corrupts JSON with any non-UTF8 bytes and is impossible for a 1.4 GB mkv. Remove the fallback entirely; if tus fails, surface the error.

## 3. macOS-style theme

Replace the current Ubuntu-purple look:
- New CSS tokens in `src/styles.css`: light "Sonoma" default (translucent white with saturated wallpaper bleed-through) + dark "Sequoia" variant, San Francisco system font stack, macOS traffic-light window controls, rounded-2xl windows with layered shadows, vibrancy blur on TopBar/Dock.
- Rewrite `TopBar.tsx` as a macOS menu bar (Apple menu → app menu → status icons on right, no wifi/battery).
- Rewrite `Dock.tsx` as a bottom-center floating dock with magnification on hover (transform scale by distance), separator, and a Trash icon.
- Window chrome in `AppWindow.tsx`: traffic-light close/min/zoom in the top-left, single-row titlebar, subtle inner border.
- New wallpapers: gradient presets that read like Sonoma / Sequoia / Big Sur.

## 4. Right-click context menus everywhere

Radix `@radix-ui/react-context-menu` is already installed. Add:
- `src/os/ContextMenu.tsx` — shared macOS-styled menu primitive (rounded, translucent, hairline divider).
- Desktop right-click: Change Wallpaper, New Folder on Desktop, Open Terminal Here, Refresh.
- Dock icon right-click: Open, Show All Windows, Quit (if running), Options → Keep in Dock.
- Files app: per-entry menu (Open, Open With Editor, Rename, Duplicate, Move to Trash, Download, Copy Path, Get Info) + blank-area menu (New Folder, Upload, Refresh, View → Grid/List).
- Editor: Cut/Copy/Paste/Select All/Save.
- Terminal: Copy/Paste/Clear/New Tab.
- Monitor: per-process Kill / Force Kill / Copy PID.
- Services: Start / Stop / Restart / Copy Unit Name / Tail Logs.
- Docker: Start / Stop / Restart / Logs / Copy ID.

Non-essential actions can be wired to a "coming soon" toast; core actions (rename, delete, kill, start/stop) hit the real endpoints already implemented.

## 5. Autohide dock in fullscreen

- Zustand: track `isFullscreen` (already there) and `dockHover`.
- When any window is maximized/fullscreen: dock slides down out of view; a 6 px sensor strip at the bottom of the screen catches `mouseenter` and slides the dock back up with a spring transition.
- Top menu bar auto-hides using the same pattern (2 px sensor at the top).
- Sensor strips are pointer-events-auto, transparent, always on top; the reveal has a small delay (150 ms) to avoid accidental triggers, and re-hides after 400 ms of no hover.
- Works whether the fullscreen came from window-zoom or browser `requestFullscreen()`.

## 6. Landing / NotConnected page: industry-grade diagrams

Redesign `NotConnectedScreen` as a real product landing:
- Hero: product name, tagline, primary CTA "Copy install command", secondary "View on GitHub" pointing at `abhas-kumar-sinha/vm-cosy-desk`.
- **Architecture diagram** (hand-built SVG, not an image): browser column ↔ HTTPS/WSS ↔ VM column with boxes for Express, tus, node-pty, `/proc`, systemctl, Docker socket — labeled arrows for each channel (REST, WebSocket PTY, SSE stats).
- **Request-flow diagram** (SVG): Login → PAM → session cookie → per-request setuid → fs/pty/system endpoints.
- **Install steps**: 3-card horizontal timeline (Clone → Build → Systemd enable) with copyable commands.
- Clear "Final URL to open" block: `http://<your-vm-ip>:8080` in a big monospace card with the note that it becomes whatever you reverse-proxy to.
- Feature grid, security notes, footer with repo + deployed preview links.

## Technical notes

- Tus metadata encoding: `new TusUpload(file, { metadata: { filename, filetype, targetDir } })`; server reads `upload.metadata.targetDir` in `onUploadFinish` — no header dependency.
- `agent/src/index.js` must mount `app.use("/api/uploads", requireAuth, uploadsRouter(config))` **before** `app.use(express.json(...))`, or scope json parser to specific routers only.
- SPA build: separate `index.html` at project root pointing at a new `src/spa-main.tsx`. Vite config uses `root: "."`, `build.outDir: "dist"`, `build.emptyOutDir: true`. Excludes `src/routes/`, `src/server.ts`, `src/start.ts` from the SPA graph (they only exist for the Lovable TanStack preview).
- Fullscreen dock reveal uses `framer-motion` `motion.div` with `animate={{ y: revealed ? 0 : 100 }}` and a `transition={{ type: "spring", stiffness: 400, damping: 32 }}`.
- Context menu portal renders into `document.body` so it escapes window `overflow: hidden`.
- No changes to auth model, PAM, PTY, or route contracts.

## Out of scope for this pass

- Multi-monitor / spaces / mission control.
- Real Trash implementation (uses `mv` to `~/.local/share/Trash`) — the menu item exists but calls the existing delete endpoint for now.
- Any Cloudflare-side changes; the Lovable preview keeps using the existing TanStack build.
