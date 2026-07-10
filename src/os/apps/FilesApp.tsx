import { useState } from "react";
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
} from "lucide-react";

interface Entry {
  name: string;
  type: "folder" | "file";
  size?: string;
  modified?: string;
}

const TREE: Record<string, Entry[]> = {
  "/home/user": [
    { name: "Documents", type: "folder", modified: "2 days ago" },
    { name: "Downloads", type: "folder", modified: "1 hour ago" },
    { name: "Pictures", type: "folder", modified: "1 week ago" },
    { name: "Music", type: "folder", modified: "3 weeks ago" },
    { name: "Videos", type: "folder", modified: "1 month ago" },
    { name: "README.md", type: "file", size: "1.2 KB", modified: "today" },
    { name: "notes.txt", type: "file", size: "342 B", modified: "today" },
    { name: ".bashrc", type: "file", size: "2.1 KB", modified: "6 months ago" },
  ],
  "/home/user/Documents": [
    { name: "resume.pdf", type: "file", size: "184 KB", modified: "5 days ago" },
    { name: "budget.xlsx", type: "file", size: "44 KB", modified: "1 week ago" },
    { name: "projects", type: "folder", modified: "2 weeks ago" },
  ],
  "/home/user/Downloads": [
    { name: "lovable-os.iso", type: "file", size: "2.4 GB", modified: "1 hour ago" },
    { name: "wallpaper.jpg", type: "file", size: "3.1 MB", modified: "3 hours ago" },
  ],
  "/home/user/Pictures": [
    { name: "sunset.jpg", type: "file", size: "2.8 MB", modified: "1 week ago" },
    { name: "screenshot.png", type: "file", size: "512 KB", modified: "yesterday" },
  ],
  "/home/user/Music": [],
  "/home/user/Videos": [],
  "/home/user/Documents/projects": [
    { name: "lovable-os", type: "folder", modified: "today" },
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

export function FilesApp() {
  const [path, setPath] = useState("/home/user");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const entries = TREE[path] ?? [];
  const filtered = entries.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));
  const crumbs = path.split("/").filter(Boolean);

  const openEntry = (e: Entry) => {
    if (e.type === "folder") {
      const next = `${path === "/" ? "" : path}/${e.name}`;
      if (TREE[next] !== undefined) setPath(next);
    }
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
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
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
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/75 hover:bg-white/5">
          <HardDrive className="h-4 w-4" /> Root (/)
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
          <div className="flex flex-1 items-center gap-1 text-sm text-white/80">
            <button onClick={() => setPath("/home/user")} className="hover:text-primary">
              /
            </button>
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
            <button
              onClick={() => setView("grid")}
              className={`rounded p-1 ${view === "grid" ? "bg-white/10" : ""}`}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded p-1 ${view === "list" ? "bg-white/10" : ""}`}
            >
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {filtered.map((e) => (
                <button
                  key={e.name}
                  onClick={() => setSelected(e.name)}
                  onDoubleClick={() => openEntry(e)}
                  className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center transition ${
                    selected === e.name ? "bg-primary/25" : "hover:bg-white/5"
                  }`}
                >
                  {e.type === "folder" ? (
                    <Folder className="h-10 w-10 text-accent-orange" />
                  ) : (
                    <FileText className="h-10 w-10 text-accent-teal" />
                  )}
                  <span className="line-clamp-2 text-xs">{e.name}</span>
                </button>
              ))}
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
                {filtered.map((e) => (
                  <tr
                    key={e.name}
                    onClick={() => setSelected(e.name)}
                    onDoubleClick={() => openEntry(e)}
                    className={`cursor-pointer border-t border-white/5 ${
                      selected === e.name ? "bg-primary/25" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="flex items-center gap-2 py-1.5 pl-2">
                      {e.type === "folder" ? (
                        <Folder className="h-4 w-4 text-accent-orange" />
                      ) : (
                        <FileText className="h-4 w-4 text-accent-teal" />
                      )}
                      {e.name}
                    </td>
                    <td className="text-white/60">{e.size ?? "—"}</td>
                    <td className="text-white/60">{e.modified}</td>
                  </tr>
                ))}
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
