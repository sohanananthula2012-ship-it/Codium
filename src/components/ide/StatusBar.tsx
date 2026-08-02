import { useIdeState } from "@/hooks/use-ide-state";
import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const { repo, activePath, sandboxId, sandboxStatus, cursorPosition, openTabs } = useIdeState();

  const ext = activePath?.split(".").pop() || "";
  const lang =
    ext === "py" ? "Python" :
    ext === "ts" || ext === "tsx" ? "TypeScript" :
    ext === "js" || ext === "jsx" ? "JavaScript" :
    ext === "md" ? "Markdown" :
    ext === "json" ? "JSON" : "Plain Text";

  const dirtyCount = openTabs.filter(t => t.dirty).length;

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#3c3c3c] bg-[#007acc] px-3 text-[11px] text-white">
      <div className="flex items-center gap-3">
        {repo && (
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {repo.branch}
            {dirtyCount > 0 && "*"}
          </span>
        )}
        {dirtyCount > 0 && <span>{dirtyCount} change{dirtyCount === 1 ? "" : "s"}</span>}
      </div>
      <div className="flex items-center gap-3">
        {sandboxStatus !== "idle" && (
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                sandboxStatus === "ready" && "bg-[#3fb950]",
                sandboxStatus === "connecting" && "animate-pulse bg-[#cca700]",
                sandboxStatus === "error" && "bg-[#f14c4c]"
              )}
            />
            Daytona{sandboxId ? `: ${sandboxId.slice(0, 8)}` : sandboxStatus === "connecting" ? "…" : ""}
          </span>
        )}
        <span>{lang}</span>
        <span>UTF-8</span>
        {activePath && (
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
        )}
        <span>Spaces: 2</span>
      </div>
    </div>
  );
}
