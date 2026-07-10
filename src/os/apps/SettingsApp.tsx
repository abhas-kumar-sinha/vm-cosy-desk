import { useState } from "react";
import { useOS } from "@/store/os-store";
import { Monitor, Palette, Info, User, Wifi, Volume2, Keyboard } from "lucide-react";

const WALLPAPERS = [
  { id: "aurora", label: "Aurora", css: "linear-gradient(135deg, #1a1033, #4a1f6b, #d84a1a)" },
  { id: "night", label: "Night", css: "linear-gradient(180deg, #0a0a1a, #1a1a4a)" },
  { id: "forest", label: "Forest", css: "linear-gradient(135deg, #0a3d2e, #1a6b47)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg, #d84a1a, #f5a623, #f8d64e)" },
];

const ACCENTS = [
  { id: "orange", label: "Orange", color: "oklch(0.65 0.19 35)" },
  { id: "purple", label: "Purple", color: "oklch(0.60 0.22 300)" },
  { id: "teal", label: "Teal", color: "oklch(0.72 0.13 195)" },
  { id: "green", label: "Green", color: "oklch(0.72 0.20 145)" },
  { id: "red", label: "Red", color: "oklch(0.62 0.24 27)" },
];

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "displays", label: "Displays", icon: Monitor },
  { id: "network", label: "Network", icon: Wifi },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "keyboard", label: "Keyboard", icon: Keyboard },
  { id: "user", label: "Users", icon: User },
  { id: "about", label: "About", icon: Info },
];

export function SettingsApp() {
  const [section, setSection] = useState("appearance");
  const wallpaper = useOS((s) => s.wallpaper);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const accent = useOS((s) => s.accent);
  const setAccent = useOS((s) => s.setAccent);

  return (
    <div className="flex h-full bg-window text-window-foreground">
      <aside className="w-52 shrink-0 border-r border-white/5 bg-black/20 p-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition ${
                active ? "bg-primary/25 text-white" : "text-white/75 hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </aside>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
        {section === "appearance" && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-lg font-semibold">Wallpaper</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWallpaper(w.id)}
                    className={`aspect-video overflow-hidden rounded-lg border-2 transition ${
                      wallpaper === w.id ? "border-primary" : "border-transparent hover:border-white/20"
                    }`}
                    style={{ background: w.css }}
                  >
                    <div className="flex h-full items-end p-2 text-xs font-medium text-white">
                      {w.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-lg font-semibold">Accent color</h2>
              <div className="flex gap-3">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.id)}
                    className={`h-10 w-10 rounded-full border-2 transition ${
                      accent === a.id ? "border-white" : "border-transparent"
                    }`}
                    style={{ background: a.color }}
                    title={a.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {section === "displays" && (
          <SettingsPane title="Displays">
            <Row label="Resolution" value="1920 × 1080 (Recommended)" />
            <Row label="Refresh rate" value="60 Hz" />
            <Row label="Scale" value="100%" />
            <Row label="Orientation" value="Landscape" />
          </SettingsPane>
        )}
        {section === "network" && (
          <SettingsPane title="Network">
            <Row label="Wi-Fi" value="LovableNet (connected)" />
            <Row label="IPv4" value="192.168.1.42" />
            <Row label="Gateway" value="192.168.1.1" />
            <Row label="DNS" value="1.1.1.1, 8.8.8.8" />
          </SettingsPane>
        )}
        {section === "sound" && (
          <SettingsPane title="Sound">
            <SliderRow label="Output volume" value={70} />
            <SliderRow label="Input volume" value={40} />
            <Row label="Output device" value="Built-in Speakers" />
          </SettingsPane>
        )}
        {section === "keyboard" && (
          <SettingsPane title="Keyboard">
            <Row label="Layout" value="English (US)" />
            <Row label="Repeat rate" value="Fast" />
            <Row label="Shortcuts" value="42 configured" />
          </SettingsPane>
        )}
        {section === "user" && (
          <SettingsPane title="Users">
            <Row label="Username" value="user" />
            <Row label="Full name" value="Lovable User" />
            <Row label="Type" value="Administrator" />
          </SettingsPane>
        )}
        {section === "about" && (
          <SettingsPane title="About">
            <Row label="OS Name" value="LovableOS" />
            <Row label="Version" value="1.0 (Aurora)" />
            <Row label="Kernel" value="6.10.0-lovable" />
            <Row label="Hostname" value="lovable-vm" />
            <Row label="Architecture" value="x86_64" />
          </SettingsPane>
        )}
      </div>
    </div>
  );
}

function SettingsPane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="divide-y divide-white/5 rounded-lg border border-white/5 bg-black/20">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-white/70">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function SliderRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3 text-sm">
      <div className="mb-2 flex justify-between">
        <span className="text-white/70">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
