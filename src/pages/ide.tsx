import { useEffect } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { LoginScreen } from "@/components/ide/LoginScreen";
import { RepoPicker } from "@/components/ide/RepoPicker";
import { SandboxGate } from "@/components/ide/SandboxGate";
import { TitleBar } from "@/components/ide/TitleBar";
import { Sidebar } from "@/components/ide/Sidebar";
import { TabBar } from "@/components/ide/TabBar";
import { StatusBar } from "@/components/ide/StatusBar";
import { MonacoEditor } from "@/components/ide/MonacoEditor";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { Files, Search, GitBranch, Bug, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

function ActivityBar() {
  const { sidebarPanel, setSidebarPanel, logout } = useIdeState();

  const items = [
    { key: "explorer" as const, icon: Files, title: "Explorer" },
    { key: "search" as const, icon: Search, title: "Search" },
    { key: "git" as const, icon: GitBranch, title: "Source Control" },
    { key: "npm" as const, icon: Bug, title: "npm Packages" },
  ];

  return (
    <div className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-[#3c3c3c] bg-[#333333] py-2">
      <div className="flex flex-col items-center gap-1">
        {items.map(({ key, icon: Icon, title }) => (
          <button
            key={key}
            onClick={() => setSidebarPanel(key)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded",
              sidebarPanel === key ? "text-white border-l-2 border-[#007acc]" : "text-[#858585] hover:text-white"
            )}
            title={title}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
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

function Breadcrumb() {
  const { activePath } = useIdeState();
  if (!activePath) return null;
  const parts = activePath.split("/");

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-[#3c3c3c] px-3 py-1 text-[12px] text-[#858585]">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-[#555]">›</span>}
          <span className={i === parts.length - 1 ? "font-medium text-[#cccccc]" : ""}>{part}</span>
        </span>
      ))}
    </div>
  );
}

export default function Ide() {
  const { token, repo, sandboxUnlocked, sandboxStatus, connectSandbox } = useIdeState();

  useEffect(() => {
    if (sandboxUnlocked && sandboxStatus === "idle") connectSandbox();
  }, [sandboxUnlocked, sandboxStatus, connectSandbox]);

  if (!token) return <LoginScreen />;
  if (!repo) return <RepoPicker />;
  if (!sandboxUnlocked) return <SandboxGate />;

  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />
        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <TabBar />
          <Breadcrumb />
          <div className="flex flex-1 overflow-hidden">
            <MonacoEditor />
          </div>
          <TerminalPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
