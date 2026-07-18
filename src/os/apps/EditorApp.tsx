import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { agent } from "@/lib/agent";
import { Save, FileText, Loader2 } from "lucide-react";

const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
  json: "json", md: "markdown", yml: "yaml", yaml: "yaml", html: "html",
  css: "css", scss: "scss", py: "python", go: "go", rs: "rust", rb: "ruby",
  sh: "shell", bash: "shell", conf: "ini", ini: "ini", toml: "ini",
  sql: "sql", xml: "xml", dockerfile: "dockerfile", java: "java", c: "c",
  cpp: "cpp", h: "cpp", php: "php",
};

function langFor(path: string) {
  const name = path.split("/").pop() ?? "";
  if (name.toLowerCase() === "dockerfile") return "dockerfile";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return LANG_BY_EXT[ext] ?? "plaintext";
}

export function EditorApp({ initialPath }: { initialPath: string | null }) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  useEffect(() => {
    if (!initialPath) return;
    (async () => {
      setBusy(true); setErr(null);
      try {
        const r = await agent.fs.read(initialPath);
        setText(r.text);
        setPath(r.path);
        setDirty(false);
        setStatus(`Loaded ${r.text.length} chars`);
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setBusy(false);
      }
    })();
  }, [initialPath]);

  const save = async () => {
    if (!path) return;
    setBusy(true); setErr(null);
    try {
      await agent.fs.write(path, text);
      setDirty(false);
      setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => { save(); });
  };

  const openManual = async () => {
    const p = prompt("Path to open", path ?? "/etc/hostname");
    if (!p) return;
    setBusy(true); setErr(null);
    try {
      const r = await agent.fs.read(p);
      setText(r.text); setPath(r.path); setDirty(false);
      setStatus(`Loaded ${r.text.length} chars`);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-white">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-3 py-1.5 text-xs">
        <FileText className="h-3.5 w-3.5 text-sky-400" />
        <span className="font-mono">{path ?? "(no file)"}</span>
        {dirty && <span className="text-amber-400">●</span>}
        <div className="flex-1" />
        <button onClick={openManual} className="rounded px-2 py-1 hover:bg-white/10">Open…</button>
        <button
          onClick={save}
          disabled={!path || !dirty || busy}
          className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-primary-foreground disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}Save
        </button>
      </div>
      {err && <div className="border-b border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-200">{err}</div>}
      <div className="min-h-0 flex-1">
        {path ? (
          <Editor
            height="100%"
            path={path}
            language={langFor(path)}
            value={text}
            theme="vs-dark"
            onChange={(v) => { setText(v ?? ""); setDirty(true); }}
            onMount={onMount}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
              minimap: { enabled: false },
              tabSize: 2,
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-white/50">
            Use the Files app or click Open… to load a file.
          </div>
        )}
      </div>
      <div className="border-t border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/50">{status}</div>
    </div>
  );
}
