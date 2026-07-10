import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useOS, type WindowState } from "@/store/os-store";
import { X, Minus, Square, Copy } from "lucide-react";

interface Props {
  win: WindowState;
  children: ReactNode;
}

export function AppWindow({ win, children }: Props) {
  const focus = useOS((s) => s.focusWindow);
  const close = useOS((s) => s.closeWindow);
  const move = useOS((s) => s.moveWindow);
  const resize = useOS((s) => s.resizeWindow);
  const minimize = useOS((s) => s.toggleMinimize);
  const maximize = useOS((s) => s.toggleMaximize);
  const activeId = useOS((s) => s.activeId);
  const isActive = activeId === win.id;

  const draggingRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizingRef = useRef<{
    startX: number;
    startY: number;
    w: number;
    h: number;
    x: number;
    y: number;
    dir: string;
  } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (draggingRef.current) {
        const { dx, dy } = draggingRef.current;
        move(win.id, Math.max(0, e.clientX - dx), Math.max(32, e.clientY - dy));
      } else if (resizingRef.current) {
        const r = resizingRef.current;
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        let w = r.w, h = r.h, x = r.x, y = r.y;
        if (r.dir.includes("e")) w = Math.max(320, r.w + dx);
        if (r.dir.includes("s")) h = Math.max(240, r.h + dy);
        if (r.dir.includes("w")) {
          w = Math.max(320, r.w - dx);
          x = r.x + (r.w - w);
        }
        if (r.dir.includes("n")) {
          h = Math.max(240, r.h - dy);
          y = Math.max(32, r.y + (r.h - h));
        }
        resize(win.id, w, h, x, y);
      }
    }
    function onUp() {
      draggingRef.current = null;
      resizingRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [win.id, move, resize]);

  if (win.minimized) return null;

  const startDrag = (e: React.MouseEvent) => {
    if (win.maximized) return;
    focus(win.id);
    draggingRef.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
  };

  const startResize = (dir: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (win.maximized) return;
    focus(win.id);
    resizingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      w: win.width,
      h: win.height,
      x: win.x,
      y: win.y,
      dir,
    };
  };

  const onMaximize = () =>
    maximize(win.id, { width: window.innerWidth, height: window.innerHeight });

  return (
    <div
      onMouseDown={() => focus(win.id)}
      className="absolute flex flex-col overflow-hidden rounded-xl glass-window"
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        outline: isActive ? "1px solid oklch(1 0 0 / 0.15)" : "1px solid transparent",
        transition: "outline-color 200ms",
      }}
    >
      {/* Header */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={onMaximize}
        className="relative flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-white/5 bg-window-header/80 px-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-1.5 pl-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              close(win.id);
            }}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] transition"
            title="Close"
          >
            <X className="h-2.5 w-2.5 text-black/60 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimize(win.id);
            }}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#febc2e]"
            title="Minimize"
          >
            <Minus className="h-2.5 w-2.5 text-black/60 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#28c840]"
            title="Maximize"
          >
            {win.maximized ? (
              <Copy className="h-2 w-2 text-black/60 opacity-0 group-hover:opacity-100" />
            ) : (
              <Square className="h-2 w-2 text-black/60 opacity-0 group-hover:opacity-100" />
            )}
          </button>
        </div>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium text-white/70">
          {win.title}
        </div>
        <div className="w-14" />
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

      {/* Resize handles */}
      {!win.maximized && (
        <>
          <div onMouseDown={startResize("n")} className="absolute inset-x-2 top-0 h-1 cursor-ns-resize" />
          <div onMouseDown={startResize("s")} className="absolute inset-x-2 bottom-0 h-1 cursor-ns-resize" />
          <div onMouseDown={startResize("e")} className="absolute inset-y-2 right-0 w-1 cursor-ew-resize" />
          <div onMouseDown={startResize("w")} className="absolute inset-y-2 left-0 w-1 cursor-ew-resize" />
          <div onMouseDown={startResize("se")} className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize" />
          <div onMouseDown={startResize("sw")} className="absolute bottom-0 left-0 h-3 w-3 cursor-nesw-resize" />
          <div onMouseDown={startResize("ne")} className="absolute top-0 right-0 h-3 w-3 cursor-nesw-resize" />
          <div onMouseDown={startResize("nw")} className="absolute top-0 left-0 h-3 w-3 cursor-nwse-resize" />
        </>
      )}
    </div>
  );
}

export function useWindowStub() {
  // placeholder if needed later
  return useState(0);
}
