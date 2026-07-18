# LovableOS Agent

Node.js server that runs on your Ubuntu / Debian VM and turns it into a
real Linux desktop in the browser. Ships alongside the React frontend in
the same repo.

## What it does

- **Real files** — browse, preview, download (streamed, seekable), edit,
  rename, delete, mkdir, plus resumable multi-GB uploads via [tus].
- **Real terminal** — a full PTY (`node-pty` spawning `bash -l` as the
  logged-in Unix user) over WebSocket.
- **Real system stats** — CPU / RAM / load / network read from `/proc`,
  streamed over SSE. Process list + kill.
- **systemctl** — list units, start / stop / restart, tail `journalctl`.
- **Docker** — containers list / start / stop / logs (when `/var/run/docker.sock` exists).
- **PAM auth** — logs in with the VM's real Linux accounts. Every fs / shell
  operation runs as that Unix user with real permissions.

## Install (one liner)

```bash
curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/main/install.sh | sudo bash
```

Or manually:

```bash
sudo apt update
sudo apt install -y git nodejs npm build-essential python3 libpam0g-dev

git clone https://github.com/<you>/<repo>.git /opt/lovable-os
cd /opt/lovable-os
npm ci                        # build web bundle deps
npm run build                 # produces ./dist
cd agent
npm ci                        # native modules: node-pty + authenticate-pam

sudo cp systemd/lovable-os.service /etc/systemd/system/
sudo mkdir -p /etc/lovable-os
echo '{"port":8080,"host":"0.0.0.0"}' | sudo tee /etc/lovable-os/config.json
sudo systemctl daemon-reload
sudo systemctl enable --now lovable-os
```

Then browse to `http://<vm-ip>:8080` and log in with your Linux user.

## Configuration

`/etc/lovable-os/config.json`:

```json
{
  "port": 8080,
  "host": "127.0.0.1",
  "allowedUsers": ["alice", "bob"],
  "uploadDir": "/var/lib/lovable-os/uploads"
}
```

- `host` defaults to `127.0.0.1`. Put Caddy or nginx in front with TLS
  before exposing publicly.
- `allowedUsers` is optional. When present, only those Linux accounts can
  log in. Omit to allow any PAM-accepted user.
- Session cookies are HMAC-signed with a per-install random secret written
  into `LOVABLE_OS_SESSION_SECRET` (or auto-generated on first boot).

## Security notes

- File operations are restricted to the user's `$HOME`, `/tmp`, and
  `/var/log` — unless they log in as `root`, in which case the whole
  filesystem is reachable.
- To let non-root users control systemctl services, add a sudoers rule:
  ```
  %sudo ALL=(root) NOPASSWD: /bin/systemctl
  ```
- To let non-root users use Docker, add them to the `docker` group.
- Bind to `127.0.0.1` and reverse-proxy with TLS for anything internet-facing.
