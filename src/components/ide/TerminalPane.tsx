import { useEffect, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

import { Trash2, Plus, ChevronDown } from "lucide-react";
import { useIdeState } from "@/hooks/use-ide-state";
import { cn } from "@/lib/utils";

const welcomeLines = [
  {
    prompt: "user@sb-7a3f2d9e:~$",
    input: "pip install numpy matplotlib",
  },
  {
    output: [
      "Collecting numpy",
      "  Downloading numpy-2.0.0-cp312-cp312-manylinux_2_17_x86_64.whl (18.2 MB)",
      "     \u2501".repeat(20) + " 18.2/18.2 MB 45.2 MB/s eta 0:00:00",
    ],
    tone: "default" as const,
  },
  {
    output: ["Successfully installed numpy-2.0.0 matplotlib-3.9.0"],
    tone: "success" as const,
  },
  { prompt: "user@sb-7a3f2d9e:~$", input: "" },
];

declare global {
  interface WindowEventMap {
    "ide:terminal-write": CustomEvent<{ text: string; tone?: "default" | "success" | "error" | "info" }>;
  }
}

export function TerminalPane() {
  const { activeTerminal, setActiveTerminal } = useIdeState();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new XTerm({
      fontFamily:
        '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
      fontSize: 12,
      lineHeight: 1.25,
      cursorBlink: true,
      cursorStyle: "block",
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
        cursor: "#ffffff",
        selectionBackground: "#264f78",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#ffffff",
      },
      convertEol: true,
      scrollback: 1000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    for (const line of welcomeLines) {
      if ("prompt" in line) {
        term.writeln(
          `\x1b[1;32m${line.prompt}\x1b[0m ${line.input ?? ""}`,
        );
      } else if ("output" in line) {
        for (const out of line.output) {
          if (line.tone === "success") {
            term.writeln(`\x1b[1;32m${out}\x1b[0m`);
          } else {
            term.writeln(out);
          }
        }
      }
    }

    let buffer = "";
    term.write(`\x1b[1;32muser@sb-7a3f2d9e:~$\x1b[0m `);
    term.onData((data) => {
      const code = data.charCodeAt(0);
      if (code === 13) {
        term.writeln("");
        const cmd = buffer.trim();
        if (cmd === "clear") {
          term.clear();
        } else if (cmd === "ls") {
          term.writeln(
            "app.py  components  requirements.txt  tests  utils.py",
          );
        } else if (cmd === "pwd") {
          term.writeln("/workspace/project-alpha");
        } else if (cmd === "whoami") {
          term.writeln("user");
        } else if (cmd.startsWith("echo ")) {
          term.writeln(cmd.slice(5));
        } else if (cmd) {
          term.writeln(
            `\x1b[1;31msandbox:\x1b[0m command not found: ${cmd}`,
          );
        }
        buffer = "";
        term.write(`\x1b[1;32muser@sb-7a3f2d9e:~$\x1b[0m `);
      } else if (code === 127) {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          term.write("\b \b");
        }
      } else if (code >= 32) {
        buffer += data;
        term.write(data);
      }
    });

    const onWrite = (e: WindowEventMap["ide:terminal-write"]) => {
      const { text, tone = "default" } = e.detail;
      const color =
        tone === "success"
          ? "\x1b[1;32m"
          : tone === "error"
            ? "\x1b[1;31m"
            : tone === "info"
              ? "\x1b[1;36m"
              : "\x1b[0m";
      const lines = text.split("\n");
      for (const line of lines) {
        term.writeln(`${color}${line}\x1b[0m`);
      }
    };
    window.addEventListener("ide:terminal-write", onWrite);

    const observer = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // layout races
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      window.removeEventListener("ide:terminal-write", onWrite);
      term.dispose();
    };
  }, []);

  return (
    <div className="flex h-[220px] shrink-0 flex-col border-t border-border bg-background">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-secondary/40 px-2 text-[12px]">
        <div className="flex items-center">
          {(["bash", "output", "problems"] as const).map((t) => {
            const isActive = activeTerminal === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTerminal(t)}
                className={cn(
                  "flex h-9 items-center gap-2 border-r border-border px-3 text-foreground/80",
                  isActive
                    ? "border-b-2 border-b-primary bg-background text-foreground"
                    : "hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    t === "bash" && "bg-success",
                    t === "output" && "bg-muted-foreground",
                    t === "problems" && "bg-warning",
                  )}
                />
                <span className="capitalize">{t}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            aria-label="Clear terminal"
            className="rounded p-1 hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="New terminal"
            className="rounded p-1 hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="More"
            className="rounded p-1 hover:bg-muted hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-background">
        {activeTerminal === "bash" ? (
          <div
            ref={containerRef}
            className="absolute inset-0 px-2 py-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-[12px] text-muted-foreground">
            {activeTerminal === "output"
              ? "No task output to display."
              : "No problems detected in the workspace."}
          </div>
        )}
      </div>
    </div>
  );
}
