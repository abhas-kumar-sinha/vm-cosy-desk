import { useOS } from "@/store/os-store";
import { APP_MAP } from "./apps-registry";
import { AnimatePresence, motion } from "framer-motion";

export function Activities() {
  const show = useOS((s) => s.showActivities);
  const setShow = useOS((s) => s.setActivities);
  const windows = useOS((s) => s.windows);
  const focus = useOS((s) => s.focusWindow);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[940] flex flex-col items-center gap-6 bg-black/50 px-8 pt-16 backdrop-blur-xl"
          onClick={() => setShow(false)}
        >
          <div className="flex flex-wrap justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            {windows.length === 0 && (
              <div className="text-sm text-white/60">No windows open — launch an app from the dock</div>
            )}
            {windows.map((w) => {
              const app = APP_MAP[w.appId];
              const Icon = app.icon;
              return (
                <motion.button
                  layoutId={`win-${w.id}`}
                  key={w.id}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => {
                    focus(w.id);
                    setShow(false);
                  }}
                  className="w-64 overflow-hidden rounded-xl border border-white/10 bg-window text-left"
                >
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color}`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="border-t border-white/5 px-3 py-2 text-sm text-white/90">
                    {w.title}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
