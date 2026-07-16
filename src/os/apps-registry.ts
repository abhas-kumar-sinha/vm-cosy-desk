import type { AppId } from "@/store/os-store";
import {
  Folder,
  Terminal as TerminalIcon,
  FileText,
  Globe,
  Settings as SettingsIcon,
  Calculator as CalcIcon,
  Activity,
  Info,
  Image as ImageIcon,
  Music,
  type LucideIcon,
} from "lucide-react";

export interface AppMeta {
  id: AppId;
  name: string;
  icon: LucideIcon;
  color: string; // tailwind gradient classes
  category: "System" | "Utilities" | "Internet" | "Media" | "Development";
  description: string;
}

export const APPS: AppMeta[] = [
  {
    id: "files",
    name: "Files",
    icon: Folder,
    color: "from-amber-400 to-orange-600",
    category: "Utilities",
    description: "Browse your file system",
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: TerminalIcon,
    color: "from-neutral-700 to-neutral-950",
    category: "Development",
    description: "Command-line interface",
  },
  {
    id: "editor",
    name: "Text Editor",
    icon: FileText,
    color: "from-sky-500 to-blue-700",
    category: "Development",
    description: "Edit text and code",
  },
  {
    id: "browser",
    name: "Web Browser",
    icon: Globe,
    color: "from-emerald-500 to-teal-700",
    category: "Internet",
    description: "Browse the web",
  },
  {
    id: "settings",
    name: "Settings",
    icon: SettingsIcon,
    color: "from-slate-500 to-slate-800",
    category: "System",
    description: "System preferences",
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: CalcIcon,
    color: "from-fuchsia-500 to-purple-700",
    category: "Utilities",
    description: "Do arithmetic",
  },
  {
    id: "monitor",
    name: "System Monitor",
    icon: Activity,
    color: "from-rose-500 to-red-700",
    category: "System",
    description: "Processes and resources",
  },
  {
    id: "about",
    name: "About",
    icon: Info,
    color: "from-indigo-500 to-violet-700",
    category: "System",
    description: "About this system",
  },
  {
    id: "gallery",
    name: "Image Viewer",
    icon: ImageIcon,
    color: "from-pink-500 to-rose-700",
    category: "Media",
    description: "View images",
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    color: "from-lime-500 to-emerald-700",
    category: "Media",
    description: "Play music",
  },
  {
    id: "preview",
    name: "Preview",
    icon: FileText,
    color: "from-cyan-500 to-blue-700",
    category: "Media",
    description: "Preview files (image, video, audio, PDF, text)",
  },
];


export const APP_MAP: Record<AppId, AppMeta> = Object.fromEntries(
  APPS.map((a) => [a.id, a]),
) as Record<AppId, AppMeta>;
