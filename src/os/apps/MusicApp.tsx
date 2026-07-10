import { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2 } from "lucide-react";

const TRACKS = [
  { title: "Aurora Rise", artist: "Kernel Panic", duration: 243, color: "from-orange-500 to-rose-600" },
  { title: "Terminal Dreams", artist: "SudoWave", duration: 198, color: "from-purple-500 to-fuchsia-700" },
  { title: "Root Access", artist: "Daemon Threads", duration: 302, color: "from-emerald-500 to-teal-700" },
  { title: "Fork & Exec", artist: "SIGKILL", duration: 187, color: "from-sky-500 to-indigo-700" },
  { title: "Kernel Space", artist: "PID One", duration: 276, color: "from-amber-500 to-orange-700" },
];

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MusicApp() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const track = TRACKS[idx];

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setPos((p) => {
        if (p >= track.duration) {
          setIdx((i) => (i + 1) % TRACKS.length);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, track.duration]);

  useEffect(() => setPos(0), [idx]);

  return (
    <div className="flex h-full bg-window">
      <div className="scrollbar-thin w-56 shrink-0 overflow-y-auto border-r border-white/5 bg-black/20 p-2">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Now playing
        </div>
        {TRACKS.map((t, i) => (
          <button
            key={i}
            onClick={() => {
              setIdx(i);
              setPlaying(true);
            }}
            className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition ${
              idx === i ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
            }`}
          >
            <div className={`h-9 w-9 shrink-0 rounded bg-gradient-to-br ${t.color}`} />
            <div className="min-w-0">
              <div className="truncate">{t.title}</div>
              <div className="truncate text-xs text-white/50">{t.artist}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-between p-8">
        <div
          className={`aspect-square w-56 rounded-2xl bg-gradient-to-br ${track.color} shadow-2xl transition-all ${
            playing ? "scale-100" : "scale-95"
          }`}
        />
        <div className="text-center">
          <div className="text-xl font-semibold text-white">{track.title}</div>
          <div className="text-sm text-white/60">{track.artist}</div>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-white/50">
            <span>{fmt(pos)}</span>
            <span>{fmt(track.duration)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(pos / track.duration) * 100}%` }}
            />
          </div>
          <div className="mt-5 flex items-center justify-center gap-4">
            <button className="text-white/60 hover:text-white">
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length)}
              className="text-white/80 hover:text-white"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % TRACKS.length)}
              className="text-white/80 hover:text-white"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            <button className="text-white/60 hover:text-white">
              <Repeat className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-white/50">
            <Volume2 className="h-4 w-4" />
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[65%] rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
