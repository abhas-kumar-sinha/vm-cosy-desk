import { useEffect, useRef, useState } from "react";

type Line = { kind: "in" | "out" | "err"; text: string };

const HELP = `Available commands:
  help              show this message
  echo <text>       print text
  ls [path]         list directory contents
  cd <dir>          change directory
  pwd               print working directory
  cat <file>        show file contents
  mkdir <dir>       create directory (session)
  touch <file>      create empty file (session)
  rm <path>         remove file/dir (session)
  whoami            print current user
  uname [-a]        system info
  date              current date
  clear             clear the screen
  neofetch          system information banner
  exit              close the terminal (no-op in web)`;

interface FSNode {
  type: "dir" | "file";
  content?: string;
  children?: Record<string, FSNode>;
}

const initialFS = (): FSNode => ({
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        user: {
          type: "dir",
          children: {
            "README.md": {
              type: "file",
              content: "# Welcome to LovableOS\n\nA Linux-inspired desktop in your browser.",
            },
            "notes.txt": { type: "file", content: "- Try `neofetch`\n- Try `ls /etc`" },
            Documents: { type: "dir", children: {} },
            Downloads: { type: "dir", children: {} },
            Pictures: { type: "dir", children: {} },
          },
        },
      },
    },
    etc: {
      type: "dir",
      children: {
        "os-release": {
          type: "file",
          content: 'NAME="LovableOS"\nVERSION="1.0 (Aurora)"\nID=lovable\n',
        },
        hostname: { type: "file", content: "lovable-vm\n" },
      },
    },
    usr: { type: "dir", children: { bin: { type: "dir", children: {} } } },
    var: { type: "dir", children: { log: { type: "dir", children: {} } } },
  },
});

function resolve(fs: FSNode, path: string[]): FSNode | null {
  let cur: FSNode = fs;
  for (const seg of path) {
    if (!cur.children || !cur.children[seg]) return null;
    cur = cur.children[seg];
  }
  return cur;
}

function normalize(cwd: string[], input: string): string[] {
  const parts = input.startsWith("/") ? input.split("/") : [...cwd, ...input.split("/")];
  const out: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out;
}

const pathStr = (p: string[]) => "/" + p.join("/");

export function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "LovableOS 1.0 (Aurora) tty1" },
    { kind: "out", text: "Type 'help' to see available commands.\n" },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number>(-1);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState<string[]>(["home", "user"]);
  const fsRef = useRef<FSNode>(initialFS());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const prompt = `user@lovable-vm:${cwd.length === 0 ? "/" : pathStr(cwd).replace("/home/user", "~")}$`;

  const run = (raw: string) => {
    const cmd = raw.trim();
    setLines((l) => [...l, { kind: "in", text: `${prompt} ${raw}` }]);
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHistIdx(-1);

    const [name, ...args] = cmd.split(/\s+/);
    const fs = fsRef.current;
    const out = (t: string, kind: Line["kind"] = "out") =>
      setLines((l) => [...l, { kind, text: t }]);

    switch (name) {
      case "help":
        out(HELP);
        break;
      case "echo":
        out(args.join(" "));
        break;
      case "pwd":
        out(pathStr(cwd) || "/");
        break;
      case "whoami":
        out("user");
        break;
      case "date":
        out(new Date().toString());
        break;
      case "uname":
        out(args[0] === "-a" ? "Linux lovable-vm 6.10.0-lovable #1 SMP x86_64 GNU/Linux" : "Linux");
        break;
      case "clear":
        setLines([]);
        break;
      case "ls": {
        const target = args[0] ? normalize(cwd, args[0]) : cwd;
        const node = resolve(fs, target);
        if (!node) return out(`ls: cannot access '${args[0]}': No such file or directory`, "err");
        if (node.type === "file") return out(args[0] ?? "");
        const entries = Object.entries(node.children ?? {});
        out(
          entries
            .map(([n, ch]) => (ch.type === "dir" ? `\x1b[34m${n}/\x1b[0m` : n))
            .join("  ")
            .replace(/\x1b\[\d+m/g, ""),
        );
        break;
      }
      case "cd": {
        if (!args[0]) return setCwd(["home", "user"]);
        const target = normalize(cwd, args[0]);
        const node = resolve(fs, target);
        if (!node) return out(`cd: no such file or directory: ${args[0]}`, "err");
        if (node.type !== "dir") return out(`cd: not a directory: ${args[0]}`, "err");
        setCwd(target);
        break;
      }
      case "cat": {
        if (!args[0]) return out("cat: missing operand", "err");
        const target = normalize(cwd, args[0]);
        const node = resolve(fs, target);
        if (!node) return out(`cat: ${args[0]}: No such file or directory`, "err");
        if (node.type === "dir") return out(`cat: ${args[0]}: Is a directory`, "err");
        out(node.content ?? "");
        break;
      }
      case "mkdir": {
        if (!args[0]) return out("mkdir: missing operand", "err");
        const target = normalize(cwd, args[0]);
        const parent = resolve(fs, target.slice(0, -1));
        if (!parent || parent.type !== "dir")
          return out(`mkdir: cannot create '${args[0]}'`, "err");
        parent.children![target[target.length - 1]] = { type: "dir", children: {} };
        break;
      }
      case "touch": {
        if (!args[0]) return out("touch: missing operand", "err");
        const target = normalize(cwd, args[0]);
        const parent = resolve(fs, target.slice(0, -1));
        if (!parent || parent.type !== "dir")
          return out(`touch: cannot touch '${args[0]}'`, "err");
        const name2 = target[target.length - 1];
        if (!parent.children![name2]) parent.children![name2] = { type: "file", content: "" };
        break;
      }
      case "rm": {
        if (!args[0]) return out("rm: missing operand", "err");
        const target = normalize(cwd, args[0]);
        const parent = resolve(fs, target.slice(0, -1));
        const key = target[target.length - 1];
        if (!parent?.children?.[key]) return out(`rm: cannot remove '${args[0]}'`, "err");
        delete parent.children[key];
        break;
      }
      case "neofetch":
        out(neofetch());
        break;
      case "exit":
        out("logout");
        break;
      default:
        out(`${name}: command not found`, "err");
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-terminal-bg font-mono text-[13px]"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto p-3 leading-relaxed">
        {lines.map((l, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-words ${
              l.kind === "err"
                ? "text-red-400"
                : l.kind === "in"
                  ? "text-terminal-fg"
                  : "text-white/85"
            }`}
          >
            {l.text}
          </pre>
        ))}
        <div className="flex items-center gap-2 text-terminal-fg">
          <span>{prompt}</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                run(input);
                setInput("");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (history.length === 0) return;
                const next = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
                setHistIdx(next);
                setInput(history[next]);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (histIdx === -1) return;
                const next = histIdx + 1;
                if (next >= history.length) {
                  setHistIdx(-1);
                  setInput("");
                } else {
                  setHistIdx(next);
                  setInput(history[next]);
                }
              } else if (e.key === "l" && e.ctrlKey) {
                e.preventDefault();
                setLines([]);
              }
            }}
            className="flex-1 border-none bg-transparent text-terminal-fg caret-terminal-accent outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

function neofetch() {
  return `
       _                    _     _      ___  ___
      | |    _____   ____ _| |__ | | ___/ _ \\/ __|
      | |   / _ \\ \\ / / _\` | '_ \\| |/ _ \\ | | \\__ \\
      | |__| (_) \\ V / (_| | |_) | |  __/ |_| |__/
      |_____\\___/ \\_/ \\__,_|_.__/|_|\\___|\\___/____/

    OS:      LovableOS 1.0 (Aurora)
    Kernel:  6.10.0-lovable
    Shell:   lsh 1.0
    DE:      Aurora Shell
    CPU:     Virtual x86_64 @ 3.2GHz
    Memory:  1024MiB / 8192MiB
    Uptime:  ${Math.floor(performance.now() / 1000)}s
`;
}
