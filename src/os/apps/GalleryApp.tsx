import { useState } from "react";

const IMAGES = [
  { title: "Aurora over mountains", gradient: "linear-gradient(135deg, #0a3a6b, #1a6b7a, #3ad4a0, #a3f0c8)" },
  { title: "Sunset dunes", gradient: "linear-gradient(135deg, #d84a1a, #f5a623, #f8d64e)" },
  { title: "Deep space", gradient: "linear-gradient(135deg, #0a0a2a, #1a1a4a, #6b4aa3)" },
  { title: "Neon city", gradient: "linear-gradient(135deg, #1a0a3a, #d81a6b, #f8d64e)" },
  { title: "Ocean waves", gradient: "linear-gradient(180deg, #0a2a3a, #1a5a7a, #3adacf)" },
  { title: "Forest morning", gradient: "linear-gradient(135deg, #0a3a2a, #1a6b47, #a3d84a)" },
];

export function GalleryApp() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex h-full flex-col bg-window">
      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ background: IMAGES[selected].gradient }}
        />
        <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur">
          {IMAGES[selected].title}
          <span className="ml-2 text-xs text-white/50">
            {selected + 1} / {IMAGES.length}
          </span>
        </div>
      </div>
      <div className="scrollbar-thin flex gap-2 overflow-x-auto border-t border-white/5 bg-black/30 p-3">
        {IMAGES.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition ${
              selected === i ? "border-primary" : "border-transparent hover:border-white/20"
            }`}
            style={{ background: img.gradient }}
          />
        ))}
      </div>
    </div>
  );
}
