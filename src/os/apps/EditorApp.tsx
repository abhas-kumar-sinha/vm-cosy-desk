import { useState } from "react";
import { Save, FileText, Undo2, Redo2 } from "lucide-react";

const INITIAL = `# Welcome to the Text Editor

This is a lightweight editor for LovableOS.

- Multi-line editing
- Word and character count
- Autosave (session)

Start typing to make it yours.`;

export function EditorApp() {
  const [text, setText] = useState(INITIAL);
  const [filename, setFilename] = useState("untitled.md");
  const [saved, setSaved] = useState(true);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text.split("\n").length;

  return (
    <div className="flex h-full flex-col bg-window">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
        <FileText className="h-4 w-4 text-accent-teal" />
        <input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-white/90 focus:outline-none"
        />
        {!saved && <span className="text-xs text-primary">● unsaved</span>}
        <button className="rounded p-1 hover:bg-white/10" title="Undo">
          <Undo2 className="h-4 w-4" />
        </button>
        <button className="rounded p-1 hover:bg-white/10" title="Redo">
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSaved(true)}
          className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        spellCheck={false}
        className="scrollbar-thin flex-1 resize-none bg-transparent p-4 font-mono text-sm text-white/90 focus:outline-none"
      />
      <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-3 py-1.5 text-xs text-white/60">
        <span>UTF-8 • Markdown</span>
        <span>
          {lines} lines • {words} words • {chars} chars
        </span>
      </div>
    </div>
  );
}
