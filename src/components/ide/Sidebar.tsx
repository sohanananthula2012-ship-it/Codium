import { useIdeState } from "@/hooks/use-ide-state";
import { FileTree } from "@/components/ide/FileTree";
import { SearchPanel } from "@/components/ide/SearchPanel";
import { SourceControl } from "@/components/ide/SourceControl";

export function Sidebar() {
  const { sidebarPanel } = useIdeState();

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-border bg-card text-foreground">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sidebarPanel === "explorer" && <FileTree />}
        {sidebarPanel === "search" && <SearchPanel />}
        {sidebarPanel === "source-control" && <SourceControl />}
        {sidebarPanel === "run" && (
          <div className="p-3 text-[13px] text-muted-foreground">
            Run and Debug configurations will appear here.
          </div>
        )}
      </div>
    </aside>
  );
}
