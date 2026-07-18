import type { AppId } from "@/store/os-store";
import {
  Folder,
  Terminal as TerminalIcon,
  FileText,
  Settings as SettingsIcon,
  Activity,
  Cog,
  Container,
  type LucideIcon,
} from "lucide-react";

export interface AppMeta {
  id: AppId;
  name: string;
  icon: LucideIcon;
  color: string;
  category: "System" | "Utilities" | "Development";
  description: string;
}

export const APPS: AppMeta[] = [
  { id: "files",    name: "Files",          icon: Folder,       color: "from-amber-400 to-orange-600",  category: "Utilities",   description: "Browse, upload, download VM files" },
  { id: "terminal", name: "Terminal",       icon: TerminalIcon, color: "from-neutral-700 to-neutral-950", category: "Development", description: "Real bash PTY on the VM" },
  { id: "editor",   name: "Editor",         icon: FileText,     color: "from-sky-500 to-blue-700",       category: "Development", description: "Edit real files with Monaco" },
  { id: "monitor",  name: "System Monitor", icon: Activity,     color: "from-rose-500 to-red-700",       category: "System",      description: "Live CPU / RAM / processes" },
  { id: "services", name: "Services",       icon: Cog,          color: "from-emerald-500 to-teal-700",   category: "System",      description: "systemctl + journalctl" },
  { id: "docker",   name: "Docker",         icon: Container,    color: "from-cyan-500 to-blue-700",      category: "System",      description: "Containers list & logs" },
  { id: "settings", name: "Settings",       icon: SettingsIcon, color: "from-slate-500 to-slate-800",    category: "System",      description: "Desktop preferences" },
];

export const APP_MAP: Record<AppId, AppMeta> = Object.fromEntries(
  APPS.map((a) => [a.id, a]),
) as Record<AppId, AppMeta>;
