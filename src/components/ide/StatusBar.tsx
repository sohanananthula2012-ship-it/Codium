import { useIdeState } from "@/hooks/use-ide-state";
import { GitBranch } from "lucide-react";

export function StatusBar() {
  const { repo, activePath } = useIdeState();

  const ext = activePath?.split(".").pop() || "";
  const lang = ext === "py" ? "Python" : ext === "ts" || ext === "tsx" ? "TypeScript" : ext === "js" ? "JavaScript" : ext === "md" ? "Markdown" : "Plain Text";

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#3c3c3c] bg-[#252526] px-3 text-[11px] text-[#858585]">
      <div className="flex items-center gap-3">
        {repo && (
          <span className="flex items-center gap-1 text-[#cccccc]">
            <GitBranch className="h-3 w-3" />
            {repo.owner}/{repo.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span>{lang}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
