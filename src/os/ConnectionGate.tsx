import { useEffect, useState } from "react";
import { agent, type AgentSession } from "@/lib/agent";
import { LoginScreen } from "@/os/LoginScreen";
import { NotConnectedScreen } from "@/os/NotConnectedScreen";
import { Desktop } from "@/os/Desktop";

type Status = "probing" | "no-agent" | "needs-login" | "ready";

export function ConnectionGate() {
  const [status, setStatus] = useState<Status>("probing");
  const [session, setSession] = useState<AgentSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    (async () => {
      try {
        await agent.health(controller.signal);
        clearTimeout(timer);
        try {
          const me = await agent.auth.me();
          if (cancelled) return;
          setSession(me);
          setStatus("ready");
        } catch {
          if (cancelled) return;
          setStatus("needs-login");
        }
      } catch {
        clearTimeout(timer);
        if (!cancelled) setStatus("no-agent");
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  if (status === "probing") {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black text-emerald-400">
        <div className="flex items-center gap-3 font-mono text-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Contacting agent…
        </div>
      </div>
    );
  }

  if (status === "no-agent") return <NotConnectedScreen />;

  if (status === "needs-login") {
    return (
      <LoginScreen
        onLoggedIn={(s) => {
          setSession(s);
          setStatus("ready");
        }}
      />
    );
  }

  return <Desktop session={session!} onLogout={() => setStatus("needs-login")} />;
}
