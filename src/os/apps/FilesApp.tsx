import { useState } from "react";
import { useOS } from "@/store/os-store";
import {
  Folder,
  FileText,
  Home,
  Download,
  Image as ImageIcon,
  Music,
  Video,
  HardDrive,
  ChevronRight,
  Search,
  Grid3x3,
  List,
  FileType2,
  FileCode,
  Star,
} from "lucide-react";

type Kind = "folder" | "image" | "video" | "audio" | "pdf" | "text" | "code" | "file";

interface Entry {
  name: string;
  kind: Kind;
  size?: string;
  modified?: string;
  url?: string;
  content?: string;
}

const README = `# LovableOS

A Linux-style web desktop for your VM.

## Features
- Draggable / resizable / maximizable windows
- File previews: image, video, audio, PDF, text, code
- Terminal, editor, browser, calculator, monitor
- Overview (F1), Launcher (Alt+F2), and quick menu

## Tips
- Double-click any file to preview it
- Drag windows by the title bar
- Double-click the title bar to maximize
`;

const NOTES = `Todo:
- Provision new VM disks
- Sync backups to S3
- Rotate SSH keys every 90 days
- Review firewall rules

Reminder: renew TLS cert before end of quarter.
`;

const BASHRC = `# ~/.bashrc

export PS1='\\[\\e[38;5;208m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[38;5;39m\\]\\w\\[\\e[0m\\]$ '
export EDITOR=nano
alias ll='ls -alh'
alias gs='git status'
alias ..='cd ..'

# Path
export PATH="$HOME/.local/bin:$PATH"
`;

const SAMPLE_IMG = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80";
const SAMPLE_IMG2 = "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80";
const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SAMPLE_AUDIO = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";
const SAMPLE_PDF = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

const TREE: Record<string, Entry[]> = {
  "/home/user": [
    { name: "Documents", kind: "folder", modified: "2 days ago" },
    { name: "Downloads", kind: "folder", modified: "1 hour ago" },
    { name: "Pictures", kind: "folder", modified: "1 week ago" },
    { name: "Music", kind: "folder", modified: "3 weeks ago" },
    { name: "Videos", kind: "folder", modified: "1 month ago" },
    { name: "README.md", kind: "text", size: "1.2 KB", modified: "today", content: README },
    { name: "notes.txt", kind: "text", size: "342 B", modified: "today", content: NOTES },
    { name: ".bashrc", kind: "code", size: "2.1 KB", modified: "6 months ago", content: BASHRC },
  ],
  "/home/user/Documents": [
    { name: "report.pdf", kind: "pdf", size: "184 KB", modified: "5 days ago", url: SAMPLE_PDF },
    { name: "server.conf", kind: "code", size: "1.4 KB", modified: "1 week ago", content: "server {\n  listen 443 ssl;\n  server_name lovable.dev;\n  root /var/www/html;\n}\n" },
    { name: "projects", kind: "folder", modified: "2 weeks ago" },
  ],
  "/home/user/Downloads": [
    { name: "landscape.jpg", kind: "image", size: "2.8 MB", modified: "1 hour ago", url: SAMPLE_IMG },
    { name: "city.jpg", kind: "image", size: "3.1 MB", modified: "3 hours ago", url: SAMPLE_IMG2 },
    { name: "sample.mp4", kind: "video", size: "158 MB", modified: "yesterday", url: SAMPLE_VIDEO },
  ],
  "/home/user/Pictures": [
    { name: "mountain.jpg", kind: "image", size: "2.8 MB", modified: "1 week ago", url: SAMPLE_IMG },
    { name: "night.jpg", kind: "image", size: "512 KB", modified: "yesterday", url: SAMPLE_IMG2 },
  ],
  "/home/user/Music": [
    { name: "ambient.mp3", kind: "audio", size: "4.2 MB", modified: "1 week ago", url: SAMPLE_AUDIO },
  ],
  "/home/user/Videos": [
    { name: "bunny.mp4", kind: "video", size: "158 MB", modified: "2 weeks ago", url: SAMPLE_VIDEO },
  ],
  "/home/user/Documents/projects": [
    { name: "lovable-os", kind: "folder", modified: "today" },
  ],
};

const SIDEBAR = [
  { label: "Home", path: "/home/user", icon: Home },
  { label: "Documents", path: "/home/user/Documents", icon: FileText },
  { label: "Downloads", path: "/home/user/Downloads", icon: Download },
  { label: "Pictures", path: "/home/user/Pictures", icon: ImageIcon },
  { label: "Music", path: "/home/user/Music", icon: Music },
  { label: "Videos", path: "/home/user/Videos", icon: Video },
];

function iconFor(kind: Kind) {
  switch (kind) {
    case "folder": return Folder;
    case "image": return ImageIcon;
    case "video": return Video;
    case "audio": return Music;
    case "pdf": return FileType2;
    case "code": return FileCode;
    default: return FileText;
  }
}

function colorFor(kind: Kind) {
  switch (kind) {
    case "folder": return "text-accent-orange";
    case "image": return "text-pink-400";
    case "video": return "text-purple-400";
    case "audio": return "text-lime-400";
    case "pdf": return "text-rose-400";
    case "code": return "text-sky-400";
    default: return "text-accent-teal";
  }
}

export function FilesApp() {
  const openApp = useOS((s) => s.openApp);
  const [path, setPath] = useState("/home/user");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const entries = TREE[path] ?? [];
  const filtered = entries.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));
  const crumbs = path.split("/").filter(Boolean);

  const openEntry = (e: Entry) => {
    if (e.kind === "folder") {
      const next = `${path === "/" ? "" : path}/${e.name}`;
      if (TREE[next] !== undefined) setPath(next);
      return;
    }
    openApp("preview", {
      title: e.name,
      payload: { kind: e.kind, url: e.url, name: e.name, content: e.content },
    });
  };

  return (
    <div className="flex h-full bg-window text-window-foreground">
      <aside className="scrollbar-thin w-52 shrink-0 overflow-y-auto border-r border-white/5 bg-black/20 p-2">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Places
        </div>
        {SIDEBAR.map((s) => {
          const Icon = s.icon;
          const active = path === s.path;
          return (
            <button
              key={s.path}
              onClick={() => setPath(s.path)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition press ${
                active ? "bg-primary/25 text-white" : "text-white/75 hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
        <div className="my-3 border-t border-white/5" />
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Devices
        </div>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/75 transition hover:bg-white/5 press">
          <HardDrive className="h-4 w-4" /> Root (/)
        </button>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/75 transition hover:bg-white/5 press">
          <Star className="h-4 w-4 text-yellow-400" /> Starred
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
          <div className="flex flex-1 items-center gap-1 text-sm text-white/80">
            <button onClick={() => setPath("/home/user")} className="hover:text-primary">/</button>
            {crumbs.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                <button
                  onClick={() => setPath("/" + crumbs.slice(0, i + 1).join("/"))}
                  className="hover:text-primary"
                >
                  {c}
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1">
            <Search className="h-3.5 w-3.5 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-32 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5">
            <button onClick={() => setView("grid")} className={`rounded p-1 transition press ${view === "grid" ? "bg-white/10" : ""}`}>
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView("list")} className={`rounded p-1 transition press ${view === "list" ? "bg-white/10" : ""}`}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
          {filtered.length === 0 && (
            <div className="grid h-full place-items-center text-sm text-white/40">
              This folder is empty
            </div>
          )}
          {view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {filtered.map((e, i) => {
                const Icon = iconFor(e.kind);
                return (
                  <button
                    key={e.name}
                    onClick={() => setSelected(e.name)}
                    onDoubleClick={() => openEntry(e)}
                    style={{ animationDelay: `${Math.min(i, 12) * 24}ms` }}
                    className={`animate-float-up flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition press ${
                      selected === e.name ? "bg-primary/25 ring-1 ring-primary/40" : "hover:bg-white/5"
                    }`}
                  >
                    {e.kind === "image" && e.url ? (
                      <div className="h-14 w-14 overflow-hidden rounded-md shadow-md">
                        <img src={e.url} alt={e.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <Icon className={`h-10 w-10 ${colorFor(e.kind)}`} />
                    )}
                    <span className="line-clamp-2 text-xs">{e.name}</span>
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const Icon = iconFor(e.kind);
                  return (
                    <tr
                      key={e.name}
                      onClick={() => setSelected(e.name)}
                      onDoubleClick={() => openEntry(e)}
                      className={`cursor-pointer border-t border-white/5 transition ${
                        selected === e.name ? "bg-primary/25" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="flex items-center gap-2 py-1.5 pl-2">
                        <Icon className={`h-4 w-4 ${colorFor(e.kind)}`} />
                        {e.name}
                      </td>
                      <td className="text-white/60">{e.size ?? "—"}</td>
                      <td className="text-white/60">{e.modified}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-white/5 bg-black/20 px-3 py-1.5 text-xs text-white/50">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
          {selected && <span className="ml-2">• {selected} selected</span>}
        </div>
      </div>
    </div>
  );
}
