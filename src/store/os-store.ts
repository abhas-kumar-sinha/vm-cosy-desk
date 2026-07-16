import { create } from "zustand";

export type AppId =
  | "files"
  | "terminal"
  | "editor"
  | "browser"
  | "settings"
  | "calculator"
  | "monitor"
  | "about"
  | "gallery"
  | "music";

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
  bootDone: boolean;
  showActivities: boolean;

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
  finishBoot: () => void;
  setActivities: (v: boolean) => void;
}

const APP_TITLES: Record<AppId, string> = {
  files: "Files",
  terminal: "Terminal",
  editor: "Text Editor",
  browser: "Web Browser",
  settings: "Settings",
  calculator: "Calculator",
  monitor: "System Monitor",
  about: "About This System",
  gallery: "Image Viewer",
  music: "Music Player",
};

const DEFAULT_SIZES: Partial<Record<AppId, { w: number; h: number }>> = {
  terminal: { w: 780, h: 480 },
  files: { w: 900, h: 580 },
  editor: { w: 820, h: 560 },
  browser: { w: 1000, h: 640 },
  settings: { w: 820, h: 560 },
  calculator: { w: 340, h: 480 },
  monitor: { w: 820, h: 540 },
  about: { w: 520, h: 420 },
  gallery: { w: 780, h: 560 },
  music: { w: 720, h: 480 },
};

export const useOS = create<OSState>((set, get) => ({
  windows: [],
  zCounter: 10,
  activeId: null,
  launcherOpen: false,
  wallpaper: "aurora",
  accent: "orange",
  bootDone: false,
  showActivities: false,

  openApp: (appId, opts) => {
    const existing = get().windows.find((w) => w.appId === appId && !opts?.payload);
    if (existing) {
      get().focusWindow(existing.id);
      if (existing.minimized) get().toggleMinimize(existing.id);
      return;
    }
    const z = get().zCounter + 1;
    const size = DEFAULT_SIZES[appId] ?? { w: 720, h: 500 };
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
  finishBoot: () => set({ bootDone: true }),
  setActivities: (v) => set({ showActivities: v, launcherOpen: false }),
}));

export const APP_TITLES_EXPORT = APP_TITLES;
