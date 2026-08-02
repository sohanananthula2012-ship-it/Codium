import { useIdeState } from "@/hooks/use-ide-state";
import { FileTree } from "./FileTree";
import { GitPanel } from "./GitPanel";
import { SearchPanel } from "./SearchPanel";
import { NpmPanel } from "./NpmPanel";

export function Sidebar() {
  const { sidebarPanel } = useIdeState();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#3c3c3c] bg-[#252526]">
      {sidebarPanel === "explorer" && <FileTree />}
      {sidebarPanel === "search" && <SearchPanel />}
      {sidebarPanel === "git" && <GitPanel />}
      {sidebarPanel === "npm" && <NpmPanel />}
    </aside>
  );
}
