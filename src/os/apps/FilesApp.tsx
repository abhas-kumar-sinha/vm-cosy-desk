import { useEffect, useRef, useState, useCallback } from "react";
import { agent, type FsEntry } from "@/lib/agent";
import {
  Folder, FileText, FileCode, Image as ImageIcon, Music, Video, FileType2,
  Home, HardDrive, ChevronRight, ChevronLeft, Search, Grid3x3, List,
  RefreshCw, Upload, FolderPlus, Trash2, Download, Edit3, X,
} from "lucide-react";

interface Props {
  openInEditor: (path: string) => void;
}

function iconFor(e: FsEntry) {
  if (e.isDir) return Folder;
  if (e.mime.startsWith("image/")) return ImageIcon;
  if (e.mime.startsWith("video/")) return Video;
  if (e.mime.startsWith("audio/")) return Music;
  if (e.mime === "application/pdf") return FileType2;
  if (/(javascript|typescript|json|x-sh|x-yaml|xml|html|css)/.test(e.mime)) return FileCode;
  return FileText;
}
function colorFor(e: FsEntry) {
  if (e.isDir) return "text-amber-400";
  if (e.mime.startsWith("image/")) return "text-pink-400";
  if (e.mime.startsWith("video/")) return "text-purple-400";
  if (e.mime.startsWith("audio/")) return "text-lime-400";
  if (e.mime === "application/pdf") return "text-rose-400";
  return "text-sky-400";
}
function fmtSize(n: number) {
  if (!n) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0; let x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(x < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function fmtTime(ms: number) {
  if (!ms) return "";
  return new Date(ms).toLocaleString();
}

export function FilesApp({ openInEditor }: Props) {
  const [path, setPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<FsEntry | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async (p: string, pushHistory = true) => {
    setLoading(true); setErr(null);
    try {
      const r = await agent.fs.list(p);
      setPath(r.path);
      setEntries(r.items);
      if (pushHistory) setHistory((h) => [...h, r.path]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await agent.auth.me();
        load(me.home);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, [load]);

  const back = () => {
    if (history.length < 2) return;
    const h = history.slice(0, -1);
    setHistory(h);
    load(h[h.length - 1], false);
  };

  const openEntry = (e: FsEntry) => {
    if (e.isDir) return load(e.path);
    if (e.mime.startsWith("text/") || /(javascript|json|xml|yaml|x-sh|shellscript)/.test(e.mime)) {
      openInEditor(e.path);
      return;
    }
    setPreview(e);
  };

  const handleDrop = async (ev: React.DragEvent) => {
    ev.preventDefault();
    setDragOver(false);
    if (!path) return;
    const files = Array.from(ev.dataTransfer.files);
    if (files.length === 0) return;
    for (const f of files) await uploadFileTus(f, path);
    load(path, false);
  };

  const mkdir = async () => {
    const name = prompt("New folder name");
    if (!name || !path) return;
    await agent.fs.mkdir(`${path}/${name}`).catch((e) => alert(e.message));
    load(path, false);
  };
  const doRename = async (e: FsEntry) => {
    const next = prompt("Rename to", e.name);
    if (!next || next === e.name) return;
    const to = e.path.replace(/\/[^/]+$/, `/${next}`);
    await agent.fs.rename(e.path, to).catch((err) => alert(err.message));
    load(path!, false);
  };
  const doDelete = async (e: FsEntry) => {
    if (!confirm(`Delete ${e.name}? This cannot be undone.`)) return;
    await agent.fs.remove(e.path).catch((err) => alert(err.message));
    load(path!, false);
  };
  const doDownload = (e: FsEntry) => {
    const a = document.createElement("a");
    a.href = agent.fs.downloadUrl(e.path, true);
    a.download = e.name;
    a.click();
  };

  const crumbs = (path ?? "").split("/").filter(Boolean);
  const filtered = entries.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const onPickUpload = async (files: FileList | null) => {
    if (!files || !path) return;
    for (const f of Array.from(files)) await uploadFileTus(f, path);
    load(path, false);
  };

  return (
    <div
      className="flex h-full bg-window text-window-foreground"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <aside className="scrollbar-thin w-52 shrink-0 overflow-y-auto border-r border-white/5 bg-black/20 p-2">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Places</div>
        <SidebarItem icon={Home} label="Home" onClick={async () => { const me = await agent.auth.me(); load(me.home); }} />
        <SidebarItem icon={FileText} label="/etc" onClick={() => load("/etc")} />
        <SidebarItem icon={HardDrive} label="/var/log" onClick={() => load("/var/log")} />
        <SidebarItem icon={Folder} label="/tmp" onClick={() => load("/tmp")} />
        <SidebarItem icon={HardDrive} label="Root (/)" onClick={() => load("/")} />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
          <button onClick={back} disabled={history.length < 2} className="rounded p-1 text-white/70 hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => path && load(path, false)} className="rounded p-1 text-white/70 hover:bg-white/10"><RefreshCw className="h-3.5 w-3.5" /></button>
          <div className="flex flex-1 items-center gap-1 text-sm text-white/80">
            <button onClick={() => load("/")} className="hover:text-primary">/</button>
            {crumbs.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                <button onClick={() => load("/" + crumbs.slice(0, i + 1).join("/"))} className="hover:text-primary">{c}</button>
              </div>
            ))}
          </div>
          <button onClick={mkdir} title="New folder" className="rounded p-1.5 text-white/70 hover:bg-white/10"><FolderPlus className="h-3.5 w-3.5" /></button>
          <button onClick={() => uploadInputRef.current?.click()} title="Upload" className="rounded p-1.5 text-white/70 hover:bg-white/10"><Upload className="h-3.5 w-3.5" /></button>
          <input ref={uploadInputRef} type="file" multiple hidden onChange={(e) => onPickUpload(e.target.files)} />
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1">
            <Search className="h-3.5 w-3.5 text-white/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-28 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none" />
          </div>
          <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5">
            <button onClick={() => setView("grid")} className={`rounded p-1 ${view === "grid" ? "bg-white/10" : ""}`}><Grid3x3 className="h-3.5 w-3.5" /></button>
            <button onClick={() => setView("list")} className={`rounded p-1 ${view === "list" ? "bg-white/10" : ""}`}><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
          {loading && <div className="grid h-full place-items-center text-sm text-white/50">Loading…</div>}
          {err && <div className="rounded-md bg-red-500/20 p-3 text-sm text-red-200">{err}</div>}
          {!loading && !err && filtered.length === 0 && (
            <div className="grid h-full place-items-center text-sm text-white/40">This folder is empty. Drag files here to upload.</div>
          )}
          {view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
              {filtered.map((e) => {
                const Icon = iconFor(e);
                return (
                  <button
                    key={e.path}
                    onClick={() => setSelected(e.path)}
                    onDoubleClick={() => openEntry(e)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition ${selected === e.path ? "bg-primary/25 ring-1 ring-primary/40" : "hover:bg-white/5"}`}
                  >
                    {e.mime.startsWith("image/") ? (
                      <div className="h-14 w-14 overflow-hidden rounded-md shadow-md">
                        <img src={agent.fs.downloadUrl(e.path)} alt={e.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <Icon className={`h-10 w-10 ${colorFor(e)}`} />
                    )}
                    <span className="line-clamp-2 break-all text-xs">{e.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-white/50">
                <tr>
                  <th className="pb-2 pl-2 font-normal">Name</th>
                  <th className="pb-2 font-normal">Size</th>
                  <th className="pb-2 font-normal">Modified</th>
                  <th className="pb-2 pr-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const Icon = iconFor(e);
                  return (
                    <tr
                      key={e.path}
                      onClick={() => setSelected(e.path)}
                      onDoubleClick={() => openEntry(e)}
                      className={`cursor-pointer border-t border-white/5 ${selected === e.path ? "bg-primary/25" : "hover:bg-white/5"}`}
                    >
                      <td className="flex items-center gap-2 py-1.5 pl-2"><Icon className={`h-4 w-4 ${colorFor(e)}`} />{e.name}</td>
                      <td className="text-white/60">{e.isDir ? "—" : fmtSize(e.size)}</td>
                      <td className="text-white/60">{fmtTime(e.mtime)}</td>
                      <td className="pr-2 text-right">
                        {!e.isDir && (
                          <button onClick={(ev) => { ev.stopPropagation(); doDownload(e); }} className="rounded p-1 text-white/60 hover:bg-white/10"><Download className="h-3.5 w-3.5" /></button>
                        )}
                        <button onClick={(ev) => { ev.stopPropagation(); doRename(e); }} className="rounded p-1 text-white/60 hover:bg-white/10"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={(ev) => { ev.stopPropagation(); doDelete(e); }} className="rounded p-1 text-white/60 hover:bg-red-500/30"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-white/5 bg-black/20 px-3 py-1.5 text-xs text-white/50">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
          {selected && <span className="ml-2">• {selected.split("/").pop()} selected</span>}
        </div>

        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-primary/10 backdrop-blur-sm">
            <div className="rounded-2xl border-2 border-dashed border-primary bg-black/40 px-8 py-6 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-primary" />
              <div className="text-sm">Drop to upload to <span className="font-mono text-primary">{path}</span></div>
              <div className="mt-1 text-xs text-white/60">Resumable · multi-GB supported</div>
            </div>
          </div>
        )}
      </div>

      {preview && <QuickLook entry={preview} onClose={() => setPreview(null)} onOpenInEditor={openInEditor} />}
    </div>
  );
}

function SidebarItem({ icon: Icon, label, onClick }: { icon: typeof Home; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/75 transition hover:bg-white/5">
      <Icon className="h-4 w-4" />{label}
    </button>
  );
}

function QuickLook({ entry, onClose, onOpenInEditor }: { entry: FsEntry; onClose: () => void; onOpenInEditor: (p: string) => void }) {
  const url = agent.fs.downloadUrl(entry.path);
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-sm">
        <span className="truncate">{entry.name}</span>
        <div className="flex items-center gap-2">
          <a href={agent.fs.downloadUrl(entry.path, true)} className="rounded px-2 py-1 text-xs hover:bg-white/10">Download</a>
          <button onClick={() => { onOpenInEditor(entry.path); onClose(); }} className="rounded px-2 py-1 text-xs hover:bg-white/10">Edit</button>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {entry.mime.startsWith("image/") && <img src={url} alt={entry.name} className="max-h-full max-w-full object-contain" />}
        {entry.mime.startsWith("video/") && <video src={url} controls className="max-h-full max-w-full" />}
        {entry.mime.startsWith("audio/") && <audio src={url} controls className="w-full max-w-lg" />}
        {entry.mime === "application/pdf" && <iframe src={url} className="h-full w-full bg-white" title={entry.name} />}
        {!/^(image|video|audio)\//.test(entry.mime) && entry.mime !== "application/pdf" && (
          <div className="text-center text-sm text-white/70">
            <div className="mb-2">Binary file — {fmtSize(entry.size)}</div>
            <a href={agent.fs.downloadUrl(entry.path, true)} className="rounded bg-primary px-3 py-1.5 text-primary-foreground">Download</a>
          </div>
        )}
      </div>
    </div>
  );
}

// Resumable upload via tus. Lazily loads @uppy/tus only when needed so the
// initial bundle stays small.
async function uploadFileTus(file: File, targetDir: string) {
  const { Upload: TusUpload } = await import("tus-js-client").catch(() => ({ Upload: null as unknown as new (...args: unknown[]) => unknown }));
  if (TusUpload) {
    await new Promise<void>((resolve, reject) => {
      const up = new (TusUpload as unknown as new (file: File, opts: Record<string, unknown>) => { start: () => void })(file, {
        endpoint: "/api/uploads",
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 8 * 1024 * 1024,
        metadata: { filename: file.name, filetype: file.type },
        headers: { "X-Target-Dir": targetDir },
        onError: (err: Error) => reject(err),
        onSuccess: () => resolve(),
      });
      up.start();
    });
    return;
  }
  // Fallback: single POST via fs write (small files only)
  const buf = await file.arrayBuffer();
  await agent.fs.write(`${targetDir}/${file.name}`, new TextDecoder().decode(buf));
}
