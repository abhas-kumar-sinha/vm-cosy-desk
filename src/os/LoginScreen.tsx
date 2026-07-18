import { useState } from "react";
import { agent, type AgentSession } from "@/lib/agent";
import { Loader2, LogIn } from "lucide-react";

export function LoginScreen({ onLoggedIn }: { onLoggedIn: (s: AgentSession) => void }) {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await agent.auth.login(user, pw);
      const me = await agent.auth.me();
      onLoggedIn(me);
    } catch (e) {
      setErr((e as Error).message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center text-white"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, oklch(0.35 0.20 300 / 0.6), transparent 55%), radial-gradient(circle at 70% 70%, oklch(0.35 0.20 35 / 0.5), transparent 55%), oklch(0.10 0.02 260)",
      }}
    >
      <div className="mb-4 text-6xl font-thin tabular-nums text-white/90" suppressHydrationWarning>
        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="mb-8 text-sm text-white/60" suppressHydrationWarning>
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
      <form
        onSubmit={submit}
        className="flex w-80 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary via-fuchsia-500 to-teal-400 text-xl font-black shadow-lg">
          {(user[0] || "?").toUpperCase()}
        </div>
        <div className="text-xs text-white/60">Sign in with your Linux account (PAM)</div>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoFocus
          autoComplete="username"
          placeholder="username"
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
          placeholder="password"
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {err && <div className="w-full rounded-md bg-red-500/20 px-3 py-2 text-center text-xs text-red-200">{err}</div>}
        <button
          type="submit"
          disabled={busy || !user || !pw}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Sign in
        </button>
      </form>
    </div>
  );
}
