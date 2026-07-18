
# LovableOS → real self-hosted VM control panel

Rewriting the simulated desktop into a genuine remote-Linux frontend for your own Ubuntu/Debian VMs. You `git clone`, run one install script, expose a port, and get a browser desktop with real files, real shell, real processes.

## New architecture

```text
┌───────────────────────────────────┐        ┌────────────────────────────────┐
│  Browser (React desktop)          │        │  Your Ubuntu/Debian VM         │
│  - Files, Terminal, Editor,       │◀──────▶│  lovable-os-agent (Node 20+)   │
│    Monitor, Services, Docker      │  HTTPS │  - Express + WebSocket         │
│  - Drag-drop uploads (resumable)  │   WSS  │  - node-pty (real bash)        │
│  - xterm.js                       │        │  - fs streaming (tus uploads)  │
│  - Monaco editor                  │        │  - PAM login (VM user accts)   │
└───────────────────────────────────┘        │  - /proc stats, systemctl,     │
                                             │    journalctl, docker.sock     │
                                             │  - runs as systemd service     │
                                             └────────────────────────────────┘
```

Two things ship in the same repo:
- `packages/agent/` — the Node.js server that runs on the VM. This is where all real functionality lives.
- `packages/web/` — the current React app, refactored to talk to the agent over `/api/*` and `/ws/*` instead of using fake data.

The Lovable preview keeps building/serving the React app, so the UI is always visible for design work, but with no agent reachable it shows a **"Not connected to a VM"** landing page with copy-paste install instructions. As soon as you deploy it to a real VM and load it there, the same UI lights up with real data.

## VM agent (Node 20+)

Runs as `systemd` service on port 8080 (configurable). Endpoints:

- **Auth**: `POST /api/auth/login` — Linux PAM via `authenticate-pam` npm module. Issues an HTTP-only session cookie (signed, 12h). Every subsequent request runs shell/fs ops as that Unix user via `setuid`/`spawn { uid, gid }`, so real Linux permissions apply.
- **Files**: `GET /api/fs/list?path=`, `GET /api/fs/read`, `GET /api/fs/download` (streamed with `Range` support for video seek), `POST /api/fs/mkdir`, `POST /api/fs/rename`, `DELETE /api/fs/rm`, `POST /api/fs/write` (Monaco save).
- **Uploads**: mounted `tus` server (`@tus/server` + `@tus/file-store`) at `/api/uploads`. Resumable, chunked, handles multi-GB files, survives page reloads and network hiccups. On complete, file is moved into the target directory as the logged-in user.
- **Terminal**: `WSS /ws/pty` — spawns `node-pty` (`bash -l`) as the logged-in Unix user, bidirectional stream, resize support.
- **Editor**: reuses fs read/write; Monaco handles the rest client-side.
- **Monitor**: `GET /api/system/stats` (streamed every 1s over SSE) — CPU/RAM/disk/network from `/proc` and `os` module; `GET /api/system/processes`, `POST /api/system/kill`.
- **Services**: `GET /api/services`, `POST /api/services/:name/{start,stop,restart}` (shells out to `systemctl` — user needs sudoers rule or agent runs as root), `GET /api/services/:name/logs` (SSE tailing `journalctl -fu`).
- **Docker**: `GET /api/docker/containers`, start/stop/logs — talks directly to `/var/run/docker.sock` via `dockerode` when present.

## Frontend refactor

- `src/lib/agent.ts` — typed client for every endpoint above, plus a `useAgentStatus()` hook that pings `/api/health` on mount.
- `src/os/ConnectionGate.tsx` — wraps the desktop. If the agent responds → normal desktop. If not (Lovable preview or agent down) → install screen with the one-liner:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/.../install.sh | sudo bash
  ```
  and a manual `git clone` fallback.
- `src/os/LoginScreen.tsx` — real PAM login (username + password), replaces the current cosmetic boot.
- Every simulated app is replaced:
  - `FilesApp` → real fs listing, thumbnails from `/api/fs/read` for images, streamed `<video>`/`<audio>` from `/api/fs/download`, PDF via `<iframe>`, drag-drop area wired to Uppy (which speaks tus). Multi-select, cut/copy/paste, context menu, keyboard nav.
  - `TerminalApp` → xterm.js + `xterm-addon-fit` + `xterm-addon-web-links` over the pty WS.
  - `EditorApp` → Monaco with syntax highlighting for 30+ languages, save-on-Ctrl+S, tab bar for multiple open files, dirty indicators.
  - `MonitorApp` → live CPU/RAM/net graphs (Recharts), process list you can sort/kill.
  - `ServicesApp` (new) → systemctl grid + inline log tail.
  - `DockerApp` (new) → containers list + logs stream.
  - Removes AboutApp, CalculatorApp, MusicApp, GalleryApp, BrowserApp (the dummy ones that don't map to real VM utility).

## Install & run on the VM

Repo ships `install.sh` and a `systemd` unit. Script:
1. Installs Node 20 via NodeSource if missing.
2. `git clone` + `npm ci` in `packages/agent` and builds the web bundle.
3. Writes `/etc/lovable-os/config.json` (port, allowed users, upload dir).
4. Installs `/etc/systemd/system/lovable-os.service`, enables + starts it.

User opens `http://vm-ip:8080`, logs in with their Linux account, gets the desktop.

## What ships in this first pass

1. Monorepo split (`packages/agent`, `packages/web`), install script, systemd unit, README with the one-liner.
2. Agent: PAM auth + session cookies, full `/api/fs/*` incl. streamed download with Range, tus uploads, `/ws/pty`, `/api/system/*`, `/api/services/*`, `/api/docker/*`.
3. Web: `ConnectionGate`, real `LoginScreen`, rewritten `FilesApp`/`TerminalApp`/`EditorApp`/`MonitorApp`, new `ServicesApp` + `DockerApp`, removes now-irrelevant demo apps.
4. Preview: "Not connected" screen with install docs so the Lovable preview stays useful for design iteration.

## Technical notes

- Native modules (`node-pty`, `authenticate-pam`) require `build-essential`, `python3`, `libpam0g-dev`; the install script installs them via `apt`.
- Agent binds `127.0.0.1` by default; user is instructed to front it with Caddy/nginx + TLS for public exposure. Bare `0.0.0.0` is documented as insecure.
- All destructive fs ops re-check the resolved absolute path stays within the logged-in user's allowed roots (config-driven, defaults to their `$HOME` + `/tmp`, or `/` for root logins).
- Cloudflare Workers preview cannot proxy the agent; that's why the preview shows install docs, not a live desktop. This is expected and called out in the UI.
- The Lovable preview build will still typecheck and render — no runtime dependency on the agent, only lazy `fetch` calls that fail gracefully into the "Not connected" state.
