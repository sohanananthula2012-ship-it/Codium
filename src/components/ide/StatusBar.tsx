import { GitBranch, RefreshCw } from "lucide-react";
import { sandbox, sourceChanges } from "@/lib/ide-seed";
import { useIdeState } from "@/hooks/use-ide-state";

export function StatusBar() {
  const { cursor, activePath } = useIdeState();
  const ext = activePath?.split(".").pop() ?? "";
  const lang =
    ext === "py"
      ? "Python 3.12.4"
      : ext === "css"
        ? "CSS"
        : ext === "md"
          ? "Markdown"
          : "Plain Text";

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-statusbar px-2 text-[11.5px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-foreground/85">
          <GitBranch className="h-3 w-3" />
          main*
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw
            className="h-3 w-3 animate-spin-slow"
            style={{ animationDuration: "3s" }}
          />
          {sourceChanges.length} changes
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-foreground/85">
          <span className="h-2 w-2 rounded-full bg-success" />
          Daytona: {sandbox.id}
        </span>
        <span>{lang}</span>
        <span>UTF-8</span>
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span>Spaces: 4</span>
      </div>
    </div>
  );
}
