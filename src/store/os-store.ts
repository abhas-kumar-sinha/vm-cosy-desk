import { create } from "zustand";

export type AppId =
  | "files"
  | "terminal"
  | "editor"
  | "monitor"
  | "services"
  | "docker"
  | "settings";

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  prev?: { x: number; y: number; width: number; height: number };
  payload?: Record<string, unknown>;
}

interface OSState {
  windows: WindowState[];
  zCounter: number;
  activeId: string | null;
  launcherOpen: boolean;
  wallpaper: string;
  accent: string;
  showActivities: boolean;
  isFullscreen: boolean;

  openApp: (appId: AppId, opts?: { title?: string; payload?: Record<string, unknown> }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number, x?: number, y?: number) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string, screen: { width: number; height: number }) => void;
  setLauncherOpen: (v: boolean) => void;
  setWallpaper: (w: string) => void;
  setAccent: (a: string) => void;
  setActivities: (v: boolean) => void;
  setFullscreen: (v: boolean) => void;
}

const APP_TITLES: Record<AppId, string> = {
  files: "Files",
  terminal: "Terminal",
  editor: "Editor",
  monitor: "System Monitor",
  services: "Services",
  docker: "Docker",
  settings: "Settings",
};

const DEFAULT_SIZES: Partial<Record<AppId, { w: number; h: number }>> = {
  terminal: { w: 860, h: 520 },
  files: { w: 980, h: 620 },
  editor: { w: 900, h: 620 },
  monitor: { w: 900, h: 580 },
  services: { w: 900, h: 580 },
  docker: { w: 900, h: 520 },
  settings: { w: 720, h: 520 },
};

export const useOS = create<OSState>((set, get) => ({
  windows: [],
  zCounter: 10,
  activeId: null,
  launcherOpen: false,
  wallpaper: "aurora",
  accent: "orange",
  showActivities: false,
  isFullscreen: false,

  openApp: (appId, opts) => {
    const existing = get().windows.find((w) => w.appId === appId && !opts?.payload);
    if (existing) {
      get().focusWindow(existing.id);
      if (existing.minimized) get().toggleMinimize(existing.id);
      return;
    }
    const z = get().zCounter + 1;
    const size = DEFAULT_SIZES[appId] ?? { w: 780, h: 540 };
    const id = `${appId}-${Date.now()}`;
    const offset = get().windows.length * 24;
    set((s) => ({
      zCounter: z,
      activeId: id,
      launcherOpen: false,
      showActivities: false,
      windows: [
        ...s.windows,
        {
          id,
          appId,
          title: opts?.title ?? APP_TITLES[appId],
          x: 120 + offset,
          y: 80 + offset,
          width: size.w,
          height: size.h,
          zIndex: z,
          minimized: false,
          maximized: false,
          payload: opts?.payload,
        },
      ],
    }));
  },

  closeWindow: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),

  focusWindow: (id) => {
    const z = get().zCounter + 1;
    set((s) => ({
      zCounter: z,
      activeId: id,
      windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)),
    }));
  },

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  resizeWindow: (id, width, height, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, width, height, x: x ?? w.x, y: y ?? w.y } : w,
      ),
    })),

  toggleMinimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
    })),

  toggleMaximize: (id, screen) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.prev) {
          return { ...w, maximized: false, ...w.prev, prev: undefined };
        }
        return {
          ...w,
          maximized: true,
          prev: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0,
          y: 32,
          width: screen.width,
          height: screen.height - 32,
        };
      }),
    })),

  setLauncherOpen: (v) => set({ launcherOpen: v, showActivities: false }),
  setWallpaper: (w) => set({ wallpaper: w }),
  setAccent: (a) => set({ accent: a }),
  setActivities: (v) => set({ showActivities: v, launcherOpen: false }),
}));
