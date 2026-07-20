import { X } from "lucide-react";
import { useIdeState } from "@/hooks/use-ide-state";
import { cn } from "@/lib/utils";

const fileColorByExt: Record<string, string> = {
  py: "text-[#519aba]",
  css: "text-[#cca700]",
  md: "text-[#519aba]",
  txt: "text-[#a074c4]",
};

export function TabBar() {
  const { openTabs, activePath, setActiveFile, closeTab } = useIdeState();

  return (
    <div
      role="tablist"
      className="flex shrink-0 items-end overflow-x-auto border-b border-border bg-secondary/40 scrollbar-thin"
    >
      {openTabs.map((tab) => {
        const ext = tab.path.split(".").pop() ?? "";
        const isActive = activePath === tab.path;
        return (
          <div
            key={tab.path}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveFile(tab.path)}
            className={cn(
              "group relative flex h-[34px] shrink-0 cursor-pointer items-center gap-2 border-r border-border px-3 text-[12.5px] transition-colors select-none",
              isActive
                ? "bg-ide-tab-active text-foreground"
                : "bg-ide-tab-inactive text-muted-foreground hover:text-foreground/85",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-mono-code",
                fileColorByExt[ext] ?? "text-muted-foreground",
              )}
            >
              {ext}
            </span>
            <span className="font-mono-code">{tab.path.split("/").pop()}</span>
            {tab.dirty && (
              <span
                aria-label="unsaved"
                className="h-1.5 w-1.5 rounded-full bg-foreground/80"
              />
            )}
            <button
              type="button"
              aria-label={`Close ${tab.path}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
              className="ml-1 flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
            {isActive && (
              <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
}
