import { useOS } from "@/store/os-store";
import { useEffect, useMemo, useState } from "react";
import { Download, ZoomIn, ZoomOut, RotateCw, Play, Pause, VolumeX, Volume2, FileText, Image as ImageIcon, Film, Music, FileType2 } from "lucide-react";

type Kind = "image" | "video" | "audio" | "pdf" | "text" | "code";

interface Payload {
  kind: Kind;
  url?: string;
  name: string;
  mime?: string;
  content?: string;
  language?: string;
}

export function PreviewApp({ winId }: { winId: string }) {
  const win = useOS((s) => s.windows.find((w) => w.id === winId));
  const payload = win?.payload as unknown as Payload | undefined;

  if (!payload) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full flex-col bg-window">
      <Toolbar payload={payload} />
      <div className="min-h-0 flex-1 overflow-hidden bg-black/40">
        {payload.kind === "image" && <ImageView payload={payload} />}
        {payload.kind === "video" && <VideoView payload={payload} />}
        {payload.kind === "audio" && <AudioView payload={payload} />}
        {payload.kind === "pdf" && <PdfView payload={payload} />}
        {(payload.kind === "text" || payload.kind === "code") && <TextView payload={payload} />}
      </div>
    </div>
  );
}

function Toolbar({ payload }: { payload: Payload }) {
  const Icon =
    payload.kind === "image" ? ImageIcon :
    payload.kind === "video" ? Film :
    payload.kind === "audio" ? Music :
    payload.kind === "pdf" ? FileType2 : FileText;

  return (
    <div className="flex items-center gap-2 border-b border-white/5 bg-black/30 px-3 py-2 text-xs text-white/80">
      <Icon className="h-4 w-4 text-primary" />
      <span className="truncate font-medium">{payload.name}</span>
      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
        {payload.kind}
      </span>
      {payload.url && (
        <a
          href={payload.url}
          download={payload.name}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 transition hover:bg-white/10 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      )}
    </div>
  );
}

function ImageView({ payload }: { payload: Payload }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  return (
    <div className="relative grid h-full w-full place-items-center overflow-auto p-6">
      <img
        src={payload.url}
        alt={payload.name}
        style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)" }}
        className="max-h-full max-w-full rounded-lg shadow-2xl animate-in-scale"
      />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-white backdrop-blur">
        <IconBtn onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}><ZoomOut className="h-4 w-4" /></IconBtn>
        <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <IconBtn onClick={() => setZoom((z) => Math.min(4, z + 0.25))}><ZoomIn className="h-4 w-4" /></IconBtn>
        <div className="mx-1 h-4 w-px bg-white/20" />
        <IconBtn onClick={() => setRot((r) => r + 90)}><RotateCw className="h-4 w-4" /></IconBtn>
      </div>
    </div>
  );
}

function VideoView({ payload }: { payload: Payload }) {
  return (
    <div className="grid h-full w-full place-items-center p-4">
      <video
        src={payload.url}
        controls
        autoPlay
        className="max-h-full max-w-full rounded-lg shadow-2xl animate-in-scale"
      />
    </div>
  );
}

function AudioView({ payload }: { payload: Payload }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio] = useState(() => (typeof Audio !== "undefined" ? new Audio() : null));

  useEffect(() => {
    if (!audio || !payload.url) return;
    audio.src = payload.url;
    audio.play().then(() => setPlaying(true)).catch(() => {});
    const onTime = () => { setProgress(audio.currentTime); setDuration(audio.duration || 0); };
    audio.addEventListener("timeupdate", onTime);
    return () => { audio.pause(); audio.removeEventListener("timeupdate", onTime); };
  }, [audio, payload.url]);

  useEffect(() => { if (audio) audio.muted = muted; }, [muted, audio]);

  const toggle = () => {
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-black p-8">
      <div className="grid h-40 w-40 place-items-center rounded-3xl bg-gradient-to-br from-lime-400 to-emerald-700 shadow-2xl animate-window-open">
        <Music className="h-20 w-20 text-white drop-shadow" />
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-white">{payload.name}</div>
        <div className="text-xs text-white/50">Audio file</div>
      </div>
      <div className="w-full max-w-md">
        <div className="mb-1 flex justify-between text-xs tabular-nums text-white/60">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <IconBtn onClick={() => setMuted((m) => !m)}>{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</IconBtn>
        <button onClick={toggle} className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95">
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 pl-0.5" />}
        </button>
        <div className="w-10" />
      </div>
    </div>
  );
}

function PdfView({ payload }: { payload: Payload }) {
  return (
    <iframe
      src={payload.url}
      title={payload.name}
      className="h-full w-full border-0 bg-white"
    />
  );
}

function TextView({ payload }: { payload: Payload }) {
  const [text, setText] = useState(payload.content ?? "");
  const [loading, setLoading] = useState(!payload.content);

  useEffect(() => {
    if (payload.content || !payload.url) return;
    setLoading(true);
    fetch(payload.url)
      .then((r) => r.text())
      .then((t) => setText(t))
      .catch((e) => setText(`Failed to load: ${e.message}`))
      .finally(() => setLoading(false));
  }, [payload.url, payload.content]);

  const lines = useMemo(() => text.split("\n"), [text]);

  if (loading) {
    return <div className="grid h-full place-items-center text-sm text-white/50">Loading…</div>;
  }

  return (
    <div className="scrollbar-thin h-full overflow-auto bg-terminal-bg p-0 font-mono text-sm">
      <table className="min-w-full">
        <tbody>
          {lines.map((ln, i) => (
            <tr key={i} className="align-top">
              <td className="select-none border-r border-white/5 px-3 py-0.5 text-right text-xs text-white/30 tabular-nums">{i + 1}</td>
              <td className="whitespace-pre px-3 py-0.5 text-white/90">{ln || " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition hover:bg-white/15 active:scale-90">
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center bg-window text-sm text-white/50">
      No file selected
    </div>
  );
}
