import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Home, Star, Lock } from "lucide-react";

const BOOKMARKS = [
  { name: "Search", url: "https://duckduckgo.com" },
  { name: "Wikipedia", url: "https://wikipedia.org" },
  { name: "MDN", url: "https://developer.mozilla.org" },
];

export function BrowserApp() {
  const [url, setUrl] = useState("about:home");
  const [input, setInput] = useState("about:home");
  const [history, setHistory] = useState<string[]>(["about:home"]);
  const [idx, setIdx] = useState(0);

  const navigate = (u: string) => {
    let normalized = u.trim();
    if (normalized === "about:home") {
      // ok
    } else if (!/^https?:\/\//.test(normalized) && !normalized.startsWith("about:")) {
      normalized = "https://" + normalized;
    }
    setUrl(normalized);
    setInput(normalized);
    const next = [...history.slice(0, idx + 1), normalized];
    setHistory(next);
    setIdx(next.length - 1);
  };

  const back = () => {
    if (idx > 0) {
      const i = idx - 1;
      setIdx(i);
      setUrl(history[i]);
      setInput(history[i]);
    }
  };
  const fwd = () => {
    if (idx < history.length - 1) {
      const i = idx + 1;
      setIdx(i);
      setUrl(history[i]);
      setInput(history[i]);
    }
  };

  return (
    <div className="flex h-full flex-col bg-window">
      <div className="flex items-center gap-1 border-b border-white/5 bg-black/20 px-2 py-1.5">
        <button onClick={back} className="rounded p-1.5 hover:bg-white/10 disabled:opacity-30" disabled={idx === 0}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={fwd}
          className="rounded p-1.5 hover:bg-white/10 disabled:opacity-30"
          disabled={idx === history.length - 1}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => navigate(url)} className="rounded p-1.5 hover:bg-white/10">
          <RotateCw className="h-4 w-4" />
        </button>
        <button onClick={() => navigate("about:home")} className="rounded p-1.5 hover:bg-white/10">
          <Home className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-3 py-1">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate(input)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none"
          />
          <Star className="h-3.5 w-3.5 text-white/50" />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-auto">
        {url === "about:home" ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
            <div className="text-center">
              <div className="mb-2 bg-gradient-to-r from-primary via-accent-purple to-accent-teal bg-clip-text text-5xl font-black text-transparent">
                LovableWeb
              </div>
              <div className="text-sm text-white/60">Your gateway to the internet</div>
            </div>
            <div className="w-full max-w-md">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate(input)}
                placeholder="Search or type URL"
                className="w-full rounded-full bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BOOKMARKS.map((b) => (
                <button
                  key={b.url}
                  onClick={() => navigate(b.url)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 text-xs text-white/80 transition hover:bg-white/10"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/40 to-accent/40 text-lg font-bold">
                    {b.name[0]}
                  </div>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-2xl font-semibold text-white/80">Sandboxed preview</div>
            <div className="max-w-md text-sm text-white/50">
              For safety, this in-app browser doesn't embed live pages. In a real deployment, this
              is where an iframe or WebView would render <span className="text-primary">{url}</span>
              .
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Open in new tab ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
