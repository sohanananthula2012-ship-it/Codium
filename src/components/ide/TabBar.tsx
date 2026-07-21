import { X } from "lucide-react";
import { useIdeState } from "@/hooks/use-ide-state";
import { cn } from "@/lib/utils";

export function TabBar() {
  const { openTabs, activePath, setActiveFile, closeTab } = useIdeState();

  return (
    <div className="flex shrink-0 overflow-x-auto border-b border-[#3c3c3c] bg-[#2d2d30]">
      {openTabs.map(tab => {
        const isActive = activePath === tab.path;
        const name = tab.path.split("/").pop() || tab.path;
        return (
          <div
            key={tab.path}
            onClick={() => setActiveFile(tab.path)}
            className={cn(
              "group relative flex h-9 shrink-0 cursor-pointer items-center gap-2 border-r border-[#3c3c3c] px-3 text-[12px] select-none",
              isActive ? "bg-[#1e1e1e] text-white" : "text-[#858585] hover:text-[#cccccc]"
            )}
          >
            <span>{name}</span>
            {tab.dirty && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            <button
              onClick={e => { e.stopPropagation(); closeTab(tab.path); }}
              className="ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c]"
            >
              <X className="h-3 w-3" />
            </button>
            {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-[#007acc]" />}
          </div>
        );
      })}
    </div>
  );
}
