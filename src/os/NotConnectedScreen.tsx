import { Terminal, Server, Github, Copy, Check, ArrowRight, ShieldCheck, Zap, Boxes, ExternalLink, Cpu, HardDrive, Folder, Container } from "lucide-react";
import { useState } from "react";

const REPO = "https://github.com/abhas-kumar-sinha/vm-cosy-desk";
const PREVIEW = "https://vm-cosy-desk.lovable.app";
const ONE_LINER = `curl -fsSL https://raw.githubusercontent.com/abhas-kumar-sinha/vm-cosy-desk/main/install.sh | sudo bash`;

const MANUAL = `# Ubuntu 22.04+ / Debian 12+
sudo apt update
sudo apt install -y git nodejs npm build-essential python3 libpam0g-dev

git clone https://github.com/abhas-kumar-sinha/vm-cosy-desk.git /opt/lovable-os
cd /opt/lovable-os && npm ci && npm run build
cd agent && npm ci

sudo cp systemd/lovable-os.service /etc/systemd/system/
sudo mkdir -p /etc/lovable-os
echo '{"port":8080,"host":"0.0.0.0"}' | sudo tee /etc/lovable-os/config.json
sudo systemctl daemon-reload && sudo systemctl enable --now lovable-os

# Open http://<your-vm-ip>:8080  —  log in with your Linux account.`;

export function NotConnectedScreen() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0a0a0f] text-white antialiased">
      {/* Ambient gradient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(1000px 500px at 15% -10%, rgba(120,119,198,.35), transparent 60%), radial-gradient(800px 600px at 90% 10%, rgba(255,120,80,.20), transparent 60%), radial-gradient(600px 400px at 50% 100%, rgba(80,200,220,.18), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* Nav */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-orange-400 to-teal-300 text-sm font-black text-black shadow-lg shadow-fuchsia-500/20">
              L
            </div>
            <div className="text-sm font-semibold tracking-tight">LovableOS</div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <a href={REPO} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 backdrop-blur transition hover:border-white/20 hover:bg-white/10">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href={PREVIEW} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-white/90">
              Live preview <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </nav>

        {/* Hero */}
        <header className="mt-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Not connected — this is the design preview
          </div>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            A real Linux desktop for your VM,
            <span className="bg-gradient-to-r from-fuchsia-300 via-orange-200 to-teal-200 bg-clip-text text-transparent"> in the browser.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70">
            LovableOS runs <em>on</em> your Ubuntu/Debian VM. It gives you real files, a real bash
            terminal, live <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">/proc</code> stats,
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">systemctl</code> control,
            and Docker &mdash; all authenticated with your Linux accounts (PAM).
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <CopyButton value={ONE_LINER}>
              <span className="font-mono text-xs">$ curl -fsSL …/install.sh | sudo bash</span>
            </CopyButton>
            <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10">
              View source <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Final URL to open */}
        <FinalUrlCard />

        {/* Architecture diagram */}
        <section className="mt-20">
          <SectionHeading eyebrow="Architecture" title="How the pieces talk to each other" />
          <ArchitectureDiagram />
        </section>

        {/* Request flow */}
        <section className="mt-20">
          <SectionHeading eyebrow="Request flow" title="From browser click to real Linux syscall" />
          <RequestFlowDiagram />
        </section>

        {/* Install steps */}
        <section className="mt-20">
          <SectionHeading eyebrow="Install" title="Three steps on any Ubuntu / Debian VM" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard n={1} title="Clone" body="Pull the repo into /opt on your VM." code="git clone https://github.com/abhas-kumar-sinha/vm-cosy-desk.git /opt/lovable-os" />
            <StepCard n={2} title="Build" body="Install deps and build the web bundle + agent." code="cd /opt/lovable-os && npm ci && npm run build && cd agent && npm ci" />
            <StepCard n={3} title="Run" body="Register the systemd unit and start the service." code="sudo cp /opt/lovable-os/agent/systemd/lovable-os.service /etc/systemd/system/ && sudo systemctl enable --now lovable-os" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <CodeCard title="One-line install" icon={<Terminal className="h-4 w-4" />} code={ONE_LINER} />
            <CodeCard title="Manual install" icon={<Github className="h-4 w-4" />} code={MANUAL} />
          </div>
        </section>

        {/* Features */}
        <section className="mt-20">
          <SectionHeading eyebrow="Once it's live" title="Everything a VM operator actually needs" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Folder} title="Real files" body="Browse, edit, rename, delete. Drag-drop uploads via tus — 30 GB per file, resumable, survives reloads." />
            <Feature icon={Terminal} title="Real bash" body="xterm.js over WebSocket → node-pty. Full interactive shell, running as your Linux user." />
            <Feature icon={Cpu} title="Live /proc" body="CPU, RAM, load, network read from /proc every second and streamed over SSE." />
            <Feature icon={Server} title="systemctl" body="List units, start / stop / restart, tail journalctl inline." />
            <Feature icon={Container} title="Docker" body="Talks directly to /var/run/docker.sock. Containers, logs, controls." />
            <Feature icon={HardDrive} title="Streamed downloads" body="Range-request downloads for seekable video / audio, inline PDF / image preview." />
          </div>
        </section>

        {/* Security */}
        <section className="mt-20 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Security posture</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                <li>• Auth via Linux <b>PAM</b>. Every fs / shell op runs as the logged-in Unix user, with real permissions.</li>
                <li>• Session cookies are HMAC-signed; per-install random secret.</li>
                <li>• Path traversal blocked — all fs paths are re-resolved against the user's allowed roots.</li>
                <li>• Bind to <code className="rounded bg-white/10 px-1 py-0.5 text-xs">127.0.0.1</code> and front with Caddy / nginx + TLS for anything internet-facing.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 text-xs text-white/40 md:flex-row md:items-center">
          <div>© LovableOS — MIT — self-hosted, no telemetry.</div>
          <div className="flex items-center gap-4">
            <a href={REPO} target="_blank" rel="noreferrer" className="hover:text-white/70">github.com/abhas-kumar-sinha/vm-cosy-desk</a>
            <a href={PREVIEW} target="_blank" rel="noreferrer" className="hover:text-white/70">vm-cosy-desk.lovable.app</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-white/40">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function FinalUrlCard() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/10 via-transparent to-transparent">
      <div className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
            Final URL to open once installed
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-white md:text-3xl">
            http://<span className="text-emerald-300">&lt;your-vm-ip&gt;</span>:8080
          </div>
          <div className="mt-1 text-xs text-white/50">
            Or whatever host you reverse-proxy to (e.g. <code>https://vm.example.com</code>). Everything is same-origin, so TLS just works.
          </div>
        </div>
        <CopyButton value="http://<your-vm-ip>:8080" small>
          <span className="font-mono text-xs">Copy URL template</span>
        </CopyButton>
      </div>
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 md:p-6">
      <svg viewBox="0 0 1000 460" className="h-auto w-full" role="img" aria-label="LovableOS architecture">
        <defs>
          <linearGradient id="g-browser" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#7c3aed" stopOpacity=".35" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity=".08" />
          </linearGradient>
          <linearGradient id="g-vm" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#10b981" stopOpacity=".32" />
            <stop offset="1" stopColor="#10b981" stopOpacity=".06" />
          </linearGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.6)" />
          </marker>
        </defs>

        {/* Browser column */}
        <g>
          <rect x="30" y="40" width="320" height="380" rx="18" fill="url(#g-browser)" stroke="rgba(255,255,255,0.12)" />
          <text x="50" y="70" fill="#c4b5fd" fontSize="12" fontFamily="ui-monospace,monospace" letterSpacing="2">BROWSER</text>
          <text x="50" y="94" fill="white" fontSize="20" fontWeight="600">React desktop</text>

          <DiagBox x={50} y={120} w={280} h={54} title="Files / Editor / Preview" sub="Monaco · tus-js-client · video/audio" color="#a78bfa" />
          <DiagBox x={50} y={186} w={280} h={54} title="Terminal" sub="xterm.js" color="#a78bfa" />
          <DiagBox x={50} y={252} w={280} h={54} title="Monitor / Services / Docker" sub="Recharts · SSE consumer" color="#a78bfa" />
          <DiagBox x={50} y={330} w={280} h={70} title="ConnectionGate + PAM login" sub="Cookie-based session" color="#c4b5fd" />
        </g>

        {/* VM column */}
        <g>
          <rect x="650" y="40" width="320" height="380" rx="18" fill="url(#g-vm)" stroke="rgba(255,255,255,0.12)" />
          <text x="670" y="70" fill="#6ee7b7" fontSize="12" fontFamily="ui-monospace,monospace" letterSpacing="2">YOUR VM (Ubuntu/Debian)</text>
          <text x="670" y="94" fill="white" fontSize="20" fontWeight="600">lovable-os-agent</text>

          <DiagBox x={670} y={120} w={280} h={54} title="Express + tus server" sub="fs · uploads · rename · rm" color="#34d399" />
          <DiagBox x={670} y={186} w={280} h={54} title="node-pty (bash -l)" sub="WebSocket /ws/pty" color="#34d399" />
          <DiagBox x={670} y={252} w={280} h={54} title="/proc · systemctl · dockerode" sub="SSE stats · journalctl -fu" color="#34d399" />
          <DiagBox x={670} y={330} w={280} h={70} title="authenticate-pam" sub="Real Linux accounts · per-op setuid" color="#6ee7b7" />
        </g>

        {/* Center pipes */}
        <g stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none">
          <path d="M330 147 C 460 147, 520 147, 670 147" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
          <path d="M330 213 C 460 213, 520 213, 670 213" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
          <path d="M330 279 C 460 279, 520 279, 670 279" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
          <path d="M330 365 C 460 365, 520 365, 670 365" markerEnd="url(#arrow)" strokeDasharray="4 4" />
        </g>
        <g fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="ui-monospace,monospace" textAnchor="middle">
          <text x="500" y="140">HTTPS · REST + tus PATCH</text>
          <text x="500" y="206">WSS · PTY stream</text>
          <text x="500" y="272">SSE · live stats + logs</text>
          <text x="500" y="358">Cookie: lovable_os_session</text>
        </g>
      </svg>
    </div>
  );
}

function DiagBox({ x, y, w, h, title, sub, color }: { x: number; y: number; w: number; h: number; title: string; sub: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" />
      <circle cx={x + 14} cy={y + h / 2} r="4" fill={color} />
      <text x={x + 28} y={y + 24} fill="white" fontSize="13" fontWeight="600">{title}</text>
      <text x={x + 28} y={y + 42} fill="rgba(255,255,255,0.55)" fontSize="11" fontFamily="ui-monospace,monospace">{sub}</text>
    </g>
  );
}

function RequestFlowDiagram() {
  const steps = [
    { title: "Login form", sub: "POST /api/auth/login" },
    { title: "PAM verify", sub: "authenticate-pam" },
    { title: "Sign session", sub: "HMAC cookie" },
    { title: "Any fs / pty / system call", sub: "cookie → session → uid/gid" },
    { title: "spawn { uid, gid }", sub: "real Linux perms enforced" },
    { title: "Response", sub: "JSON · stream · SSE · WS" },
  ];
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-6">
      <div className="flex min-w-[880px] items-stretch gap-3">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-1 items-stretch">
            <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-widest text-teal-300">Step {i + 1}</div>
              <div className="mt-1 text-sm font-semibold">{s.title}</div>
              <div className="mt-1 font-mono text-[11px] text-white/50">{s.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center px-2 text-white/40">
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard({ n, title, body, code }: { n: number; title: string; body: string; code: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-orange-400/30 text-sm font-bold">{n}</div>
        <div className="text-base font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-sm text-white/60">{body}</div>
      <pre className="mt-3 overflow-auto rounded-lg bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">{code}</pre>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Zap; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-white/80">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-white/60">{body}</div>
    </div>
  );
}

function CopyButton({ value, children, small }: { value: string; children: React.ReactNode; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={`inline-flex items-center gap-2 rounded-lg bg-white text-black transition hover:bg-white/90 ${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function CodeCard({ title, icon, code }: { title: string; icon: React.ReactNode; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-xs text-white/70">
        <div className="flex items-center gap-2">{icon}<span>{title}</span></div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="scrollbar-thin max-h-72 overflow-auto whitespace-pre px-4 py-3 font-mono text-[11px] leading-relaxed text-emerald-300">
{code}
      </pre>
    </div>
  );
}

// used to satisfy Boxes import reference
export const __unused = Boxes;
