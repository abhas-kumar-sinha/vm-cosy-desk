import { useEffect, useState } from "react";
import { useOS } from "@/store/os-store";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_MESSAGES = [
  "[  OK  ] Reached target Basic System.",
  "[  OK  ] Started D-Bus System Message Bus.",
  "[  OK  ] Started Network Manager.",
  "[  OK  ] Reached target Network.",
  "[  OK  ] Started Login Service.",
  "[  OK  ] Started Aurora Display Manager.",
  "[  OK  ] Reached target Graphical Interface.",
];

export function BootScreen() {
  const done = useOS((s) => s.bootDone);
  const finish = useOS((s) => s.finishBoot);
  const [phase, setPhase] = useState<"boot" | "login">("boot");
  const [messages, setMessages] = useState<string[]>([]);
  const [user, setUser] = useState("user");
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (done) return;
    let i = 0;
    const t = setInterval(() => {
      setMessages((m) => [...m, BOOT_MESSAGES[i]]);
      i++;
      if (i >= BOOT_MESSAGES.length) {
        clearInterval(t);
        setTimeout(() => setPhase("login"), 500);
      }
    }, 220);
    return () => clearInterval(t);
  }, [done]);

  if (done) return null;

  return (
    <AnimatePresence>
      <motion.div
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black"
      >
        {phase === "boot" && (
          <div className="w-full max-w-2xl px-6 font-mono text-[13px] text-emerald-400">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary via-accent-purple to-accent-teal text-sm font-black text-white">
                L
              </div>
              <span className="text-white/90">LovableOS 1.0 (Aurora)</span>
            </div>
            {messages.map((m, i) => (
              <div key={i} className="leading-relaxed">
                {m}
              </div>
            ))}
            <div className="mt-1 h-3 w-2 caret-blink bg-emerald-400" />
          </div>
        )}
        {phase === "login" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, oklch(0.35 0.20 300 / 0.6), transparent 55%), radial-gradient(circle at 70% 70%, oklch(0.35 0.20 35 / 0.5), transparent 55%), oklch(0.10 0.02 260)",
            }}
          >
            <div className="mb-4 text-6xl font-thin text-white/90 tabular-nums">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="mb-8 text-sm text-white/60">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                finish();
              }}
              className="flex w-72 flex-col items-center gap-4 rounded-2xl p-6 glass-panel"
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary via-accent-purple to-accent-teal text-2xl font-black text-white shadow-lg">
                {user[0]?.toUpperCase() ?? "U"}
              </div>
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Password (press enter)"
                autoFocus
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-center text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Sign in
              </button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
