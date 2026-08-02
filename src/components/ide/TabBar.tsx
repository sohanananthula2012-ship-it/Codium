import { X, Save } from "lucide-react";
import { useIdeState } from "@/hooks/use-ide-state";
import { cn } from "@/lib/utils";

export function TabBar() {
  const { openTabs, activePath, setActiveFile, closeTab, saveAll } = useIdeState();
  const dirtyCount = openTabs.filter(t => t.dirty).length;

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#2d2d30]">
      <div className="flex overflow-x-auto">
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

      {dirtyCount > 0 && (
        <button
          onClick={saveAll}
          title={`Save all ${dirtyCount} changed file${dirtyCount === 1 ? "" : "s"}`}
          className="mr-2 flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-[#cccccc] hover:bg-[#3c3c3c]"
        >
          <Save className="h-3.5 w-3.5" />
          Save All ({dirtyCount})
        </button>
      )}
    </div>
  );
}
