import { useIdeState } from "@/hooks/use-ide-state";
import { LoginScreen } from "@/components/ide/LoginScreen";
import { RepoPicker } from "@/components/ide/RepoPicker";
import { TitleBar } from "@/components/ide/TitleBar";
import { Sidebar } from "@/components/ide/Sidebar";
import { TabBar } from "@/components/ide/TabBar";
import { StatusBar } from "@/components/ide/StatusBar";
import { MonacoEditor } from "@/components/ide/MonacoEditor";
import { Files, GitBranch, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

function ActivityBar() {
  const { sidebarPanel, setSidebarPanel, logout } = useIdeState();

  return (
    <div className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-[#3c3c3c] bg-[#333333] py-2">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => setSidebarPanel("explorer")}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded",
            sidebarPanel === "explorer"
              ? "text-white border-l-2 border-[#007acc]"
              : "text-[#858585] hover:text-white"
          )}
          title="Explorer"
        >
          <Files className="h-5 w-5" />
        </button>
        <button
          onClick={() => setSidebarPanel("git")}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded",
            sidebarPanel === "git"
              ? "text-white border-l-2 border-[#007acc]"
              : "text-[#858585] hover:text-white"
          )}
          title="Source Control"
        >
          <GitBranch className="h-5 w-5" />
        </button>
      </div>
      <button
        onClick={logout}
        className="flex h-10 w-10 items-center justify-center rounded text-[#858585] hover:text-white"
        title="Log out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function Ide() {
  const { token, repo } = useIdeState();

  if (!token) return <LoginScreen />;
  if (!repo) return <RepoPicker />;

  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TabBar />
          <div className="flex flex-1 overflow-hidden">
            <MonacoEditor />
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
