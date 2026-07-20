import { lazy, Suspense } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { fileContents } from "@/lib/ide-seed";
import { cn } from "@/lib/utils";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.default })),
);

export function MonacoEditorPane() {
  const { activePath, setDirty, setCursor } = useIdeState();

  const value =
    (activePath && fileContents[activePath]) ??
    "# Daytona Code Editor\n\nSelect a file from the explorer to start editing.";

  const ext = activePath?.split(".").pop() ?? "";
  const language =
    ext === "py"
      ? "python"
      : ext === "css"
        ? "css"
        : ext === "md"
          ? "markdown"
          : "plaintext";

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center p-4 text-center font-mono-code text-[12px] text-muted-foreground">
            Loading editor…
          </div>
        }
      >
        <MonacoEditor
          key={activePath ?? "welcome"}
          value={value}
          language={language}
          theme="vs-dark"
          loading={
            <div className="flex h-full items-center justify-center p-4 text-center font-mono-code text-[12px] text-muted-foreground">
              Booting Monaco…
            </div>
          }
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((e) => {
              setCursor({ line: e.position.lineNumber, col: e.position.column });
            });
          }}
          onChange={() => activePath && setDirty(activePath, true)}
          options={{
            fontFamily:
              '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
            fontSize: 13,
            fontLigatures: true,
            lineNumbers: "on",
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            renderLineHighlight: "all",
            padding: { top: 8 },
            tabSize: 4,
            wordWrap: "off",
          }}
        />
      </Suspense>
      {/* Welcome overlay when nothing is open */}
      {!activePath && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80">
          <div className={cn("font-mono-code text-6xl font-bold text-primary")}>
            D
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Daytona Code Editor
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a file from the explorer to start editing.
          </p>
        </div>
      )}
    </div>
  );
}
