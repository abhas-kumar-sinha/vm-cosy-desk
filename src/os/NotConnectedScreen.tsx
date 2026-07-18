import { Terminal, Server, Github, Copy, Check } from "lucide-react";
import { useState } from "react";

const ONE_LINER = `curl -fsSL https://raw.githubusercontent.com/your-org/lovable-os/main/install.sh | sudo bash`;

const MANUAL = `# Ubuntu 22.04+ / Debian 12+
sudo apt update
sudo apt install -y git nodejs npm build-essential python3 libpam0g-dev

git clone https://github.com/your-org/lovable-os.git /opt/lovable-os
cd /opt/lovable-os
npm ci && npm run build
cd agent && npm ci

sudo cp systemd/lovable-os.service /etc/systemd/system/
echo '{"port":8080,"host":"0.0.0.0"}' | sudo tee /etc/lovable-os/config.json
sudo systemctl enable --now lovable-os

# Then open http://<vm-ip>:8080 and log in with your Linux account.`;

export function NotConnectedScreen() {
  return (
    <div
      className="fixed inset-0 overflow-auto text-white"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, oklch(0.35 0.20 300 / 0.55), transparent 55%), radial-gradient(circle at 80% 30%, oklch(0.35 0.18 35 / 0.5), transparent 55%), radial-gradient(circle at 50% 90%, oklch(0.35 0.15 220 / 0.55), transparent 60%), oklch(0.10 0.02 260)",
      }}
    >
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-teal-400 text-lg font-black shadow-lg">
            L
          </div>
          <div>
            <div className="text-lg font-semibold">LovableOS</div>
            <div className="text-xs text-white/60">A real Linux desktop for your VM, in the browser.</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <Server className="h-4 w-4" />
            <span className="text-sm font-medium">Not connected to a VM</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">This is the design preview.</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            LovableOS is meant to run <em>on</em> your Ubuntu or Debian VM. What you're seeing now is
            just the frontend — no filesystem, no shell, no processes. To use it for real, install the
            agent on your VM. Once it's running, open <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs">http://your-vm:8080</code> and
            everything lights up.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <CodeCard title="One-line install" icon={<Terminal className="h-4 w-4" />} code={ONE_LINER} />
          <CodeCard title="Manual install" icon={<Github className="h-4 w-4" />} code={MANUAL} />
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-white/70">
          <div className="mb-2 font-medium text-white">What you get once it's connected</div>
          <ul className="grid list-disc gap-1 pl-5 md:grid-cols-2">
            <li>File manager with drag-drop uploads (resumable, multi-GB)</li>
            <li>Streamed video / audio / image / PDF preview</li>
            <li>xterm.js terminal wired to real <code>bash</code></li>
            <li>Monaco editor that reads &amp; saves real files</li>
            <li>Live CPU / RAM / network graphs from <code>/proc</code></li>
            <li>Process list you can kill</li>
            <li><code>systemctl</code> control + <code>journalctl</code> tail</li>
            <li>Docker containers list / start / stop / logs</li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-white/50">
          Auth uses your VM's Linux accounts (PAM). Every operation runs as the logged-in Unix user
          with real permissions. Bind to <code>127.0.0.1</code> and put Caddy / nginx in front with
          TLS for anything internet-facing.
        </div>
      </div>
    </div>
  );
}

function CodeCard({ title, icon, code }: { title: string; icon: React.ReactNode; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-xs text-white/70">
        <div className="flex items-center gap-2">{icon}<span>{title}</span></div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="scrollbar-thin max-h-64 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300">
{code}
      </pre>
    </div>
  );
}
