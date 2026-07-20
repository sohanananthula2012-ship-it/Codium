import { TabBar } from "@/components/ide/TabBar";
import { Breadcrumbs } from "@/components/ide/Breadcrumbs";
import { MonacoEditorPane } from "@/components/ide/MonacoEditor";
import { Terminal } from "@/components/ide/Terminal";
import { useIdeState } from "@/hooks/use-ide-state";

export function EditorArea() {
  const { terminalOpen } = useIdeState();

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <TabBar />
      <Breadcrumbs />
      <div className="flex min-h-0 flex-1 flex-col">
        <MonacoEditorPane />
        {terminalOpen && <Terminal />}
      </div>
    </div>
  );
}
