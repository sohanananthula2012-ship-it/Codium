import { useEffect, useRef, useState, type ReactNode } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useIdeState } from "@/hooks/use-ide-state";
import { DaytonaClient } from "@/lib/daytona";
import { Trash2, Play, Loader2, Cloud, CheckCircle2, Plus, Minimize2, Maximize2, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelTab = "bash" | "output" | "problems";

const RUNNERS: Record<string, (path: string) => string> = {
  py: path => `python3 ${path}`,
  js: path => `node ${path}`,
  mjs: path => `node ${path}`,
  ts: path => `npx tsx ${path}`,
  sh: path => `bash ${path}`,
  html: path => serveStaticCmd(path),
  htm: path => serveStaticCmd(path),
};

const SERVE_EXTENSIONS = new Set(["html", "htm"]);

function serveStaticCmd(path: string) {
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ".";
  const logFile = `/tmp/codium-http-${Date.now()}.log`;
  // HTML isn't something you "run" — it needs to be served. This starts a
  // detached static file server (port 0 = let the OS pick a free one) and
  // reads back which port it bound to. The terminal server's port-scanner
  // will also pick it up and surface a preview pill within a few seconds.
  return `cd ${dir} && (setsid python3 -m http.server 0 --bind 0.0.0.0 > ${logFile} 2>&1 < /dev/null &) && sleep 1 && cat ${logFile}`;
}

export function TerminalPanel() {
  const {
    sandboxId,
    sandboxStatus,
    wsUrl,
    repoDir,
    connectSandbox,
    activePath,
    terminalVisible,
    setTerminalVisible,
    terminalMaximized,
    setTerminalMaximized,
    openPorts,
    reportPort,
    getPortPreviewUrl,
  } = useIdeState();
  const [tab, setTab] = useState<PanelTab>("bash");
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [connectionKey, setConnectionKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const initedForUrl = useRef<string | null>(null);

  // Create the xterm instance once, on mount
  useEffect(() => {
    if (!containerRef.current || termRef.current) return;
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.35,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      theme: {
        background: "#1e1e1e", foreground: "#cccccc", cursor: "#ffffff",
        selectionBackground: "#264f78",
        black: "#1e1e1e", red: "#f14c4c", green: "#3fb950", yellow: "#cca700",
        blue: "#569cd6", magenta: "#c586c0", cyan: "#4ec9b0", white: "#cccccc",
        brightBlack: "#666666", brightRed: "#f14c4c", brightGreen: "#3fb950",
        brightYellow: "#e5e510", brightBlue: "#569cd6", brightMagenta: "#c586c0",
        brightCyan: "#4ec9b0", brightWhite: "#ffffff",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const onResize = () => fitRef.current?.fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Re-fit whenever the Bash tab becomes visible again, or the panel maximizes
  useEffect(() => {
    if (tab === "bash") requestAnimationFrame(() => fitRef.current?.fit());
  }, [tab, terminalMaximized]);

  // Open the websocket once a sandbox URL is available (or when "New Terminal" bumps connectionKey)
  useEffect(() => {
    if (!wsUrl || !termRef.current) return;
    const key = `${wsUrl}:${connectionKey}`;
    if (initedForUrl.current === key) return;
    initedForUrl.current = key;

    const term = termRef.current;
    term.reset();
    term.write("\x1b[2mConnecting to sandbox shell...\x1b[0m\r\n");

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => term.write("\x1b[32mConnected.\x1b[0m\r\n");
    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "data") term.write(msg.data);
        else if (msg.type === "port") reportPort(msg.port);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => term.write("\r\n\x1b[31mDisconnected from sandbox.\x1b[0m\r\n");
    ws.onerror = () => term.write("\r\n\x1b[31mConnection error.\x1b[0m\r\n");

    const dataDisposable = term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    return () => {
      dataDisposable.dispose();
      ws.close();
    };
  }, [wsUrl, connectionKey, reportPort]);

  const runActiveFile = async () => {
    if (!sandboxId || !activePath) return;
    const ext = activePath.split(".").pop() ?? "";
    const buildCmd = RUNNERS[ext];

    setTab("output");
    if (!buildCmd) {
      setOutputLog(l => [...l, `Don't know how to run .${ext} files yet.`]);
      return;
    }

    const cmd = buildCmd(activePath);
    setRunning(true);
    setOutputLog(l => [...l, `$ ${cmd}`]);
    try {
      const result = await DaytonaClient.exec(sandboxId, cmd, repoDir ?? undefined);
      setOutputLog(l => [...l, result.output, `[exit code ${result.exitCode}]`]);
      if (SERVE_EXTENSIONS.has(ext)) {
        setOutputLog(l => [
          ...l,
          "Serving as a static site — a \"Port …\" pill will appear next to the tabs above in a few seconds. Click it to open.",
        ]);
      }
    } catch (err: any) {
      setOutputLog(l => [...l, `Error: ${err.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const openPreview = async (port: number) => {
    try {
      const url = await getPortPreviewUrl(port);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      setOutputLog(l => [...l, `Error getting preview link for port ${port}: ${err.message}`]);
    }
  };

  if (!terminalVisible) return null;

  const dotColor =
    sandboxStatus === "ready" ? "#3fb950" : sandboxStatus === "connecting" ? "#cca700" : "#666666";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col border-t border-[#3c3c3c] bg-[#1e1e1e]",
        terminalMaximized ? "absolute inset-0 z-20 h-full" : "h-64"
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#3c3c3c] pr-1.5">
        <div className="flex h-full items-center">
          <PanelTabButton active={tab === "bash"} onClick={() => setTab("bash")} dotColor={dotColor}>
            Bash
          </PanelTabButton>
          <PanelTabButton active={tab === "output"} onClick={() => setTab("output")}>
            Output
          </PanelTabButton>
          <PanelTabButton active={tab === "problems"} onClick={() => setTab("problems")}>
            Problems
          </PanelTabButton>

          {openPorts.length > 0 && (
            <div className="ml-3 flex items-center gap-1.5">
              {openPorts.map(p => (
                <button
                  key={p.port}
                  onClick={() => openPreview(p.port)}
                  title={`Open a public preview link for port ${p.port}`}
                  className="flex items-center gap-1 rounded-full border border-[#3c3c3c] bg-[#2a2d2e] px-2 py-0.5 text-[10.5px] text-[#cccccc] hover:border-[#007acc] hover:text-white"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Port {p.port}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {sandboxStatus === "ready" && activePath && (
            <button
              onClick={runActiveFile}
              disabled={running}
              title="Run active file"
              className="flex h-6 items-center gap-1.5 rounded px-2 text-[11px] font-medium text-[#3fb950] hover:bg-[#2a2d2e] disabled:opacity-50"
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Run
            </button>
          )}
          <IconButton
            title="New terminal"
            onClick={() => {
              if (wsUrl) setConnectionKey(k => k + 1);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title="Clear"
            onClick={() => {
              termRef.current?.clear();
              setOutputLog([]);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            title={terminalMaximized ? "Restore panel" : "Maximize panel"}
            onClick={() => setTerminalMaximized(!terminalMaximized)}
          >
            {terminalMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </IconButton>
          <IconButton title="Close panel" onClick={() => setTerminalVisible(false)}>
            <X className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {sandboxStatus !== "ready" && tab === "bash" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1e1e1e] text-sm text-[#858585]">
            {sandboxStatus === "connecting" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-[#007acc]" />
                <span>Spinning up your Daytona sandbox…</span>
              </>
            ) : sandboxStatus === "error" ? (
              <>
                <span className="text-[#f14c4c]">Couldn't connect to the sandbox</span>
                <button
                  onClick={connectSandbox}
                  className="rounded bg-[#007acc] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0066aa]"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <Cloud className="h-5 w-5" />
                <button
                  onClick={connectSandbox}
                  className="rounded bg-[#007acc] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0066aa]"
                >
                  Connect Daytona sandbox
                </button>
              </>
            )}
          </div>
        )}

        <div ref={containerRef} className={cn("h-full pl-2 pt-1", tab !== "bash" && "hidden")} />

        {tab === "output" && (
          <div className="h-full overflow-y-auto px-3 py-2 font-mono text-[12.5px] text-[#cccccc]">
            {outputLog.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[#666]">
                <CheckCircle2 className="h-5 w-5" />
                <p>Run a file to see its output here.</p>
              </div>
            ) : (
              outputLog.map((line, i) => (
                <pre key={i} className="whitespace-pre-wrap leading-relaxed">
                  {line}
                </pre>
              ))
            )}
          </div>
        )}

        {tab === "problems" && (
          <div className="flex h-full items-center justify-center text-sm text-[#666]">
            No problems detected.
          </div>
        )}
      </div>
    </div>
  );
}

function PanelTabButton({
  children,
  active,
  onClick,
  dotColor,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-full items-center gap-1.5 border-b-2 px-3 text-[12px] transition-colors",
        active ? "border-[#007acc] text-white" : "border-transparent text-[#969696] hover:text-white"
      )}
    >
      {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
      {children}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded text-[#b3b3b3] hover:bg-[#3c3c3c] hover:text-white"
    >
      {children}
    </button>
  );
}
