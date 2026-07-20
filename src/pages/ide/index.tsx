import { useCallback } from "react";
import { toast } from "sonner";

import { TitleBar } from "@/components/ide/TitleBar";
import { ActivityBar } from "@/components/ide/ActivityBar";
import { Sidebar } from "@/components/ide/Sidebar";
import { EditorArea } from "@/components/ide/EditorArea";
import { StatusBar } from "@/components/ide/StatusBar";
import { CommandPalette } from "@/components/ide/CommandPalette";
import { ErrorBoundary } from "@/components/ide/ErrorBoundary";

import {
  IdeStateProvider,
  useIdeState,
  type IdeContextValue,
} from "@/hooks/use-ide-state";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { sandbox } from "@/lib/ide-seed";

function writeTerminal(
  text: string,
  tone: "default" | "success" | "error" | "info" = "default",
) {
  window.dispatchEvent(
    new CustomEvent("ide:terminal-write", { detail: { text, tone } }),
  );
}

function runCurrentFile(state: IdeContextValue) {
  const path = state.activePath;
  if (!path) {
    toast.warning("No file is open.");
    return;
  }
  const fileName = path.split("/").pop();
  const ext = path.split(".").pop();
  if (ext !== "py" && ext !== "js" && ext !== "ts") {
    toast.info(`Run is not supported for .${ext} files.`);
    return;
  }
  writeTerminal(
    `\u276f Running ${fileName} on sandbox ${sandbox.id}...`,
    "info",
  );
  setTimeout(() => {
    writeTerminal("Collecting chart data...");
    writeTerminal("Generating visualization...");
    writeTerminal(
      `Chart saved. Sandbox ID: ${sandbox.id}\nProcess exited with code 0.`,
      "success",
    );
    toast.success(`${fileName} finished in ${sandbox.id}.`);
  }, 600);
}

function installPackages() {
  writeTerminal("user@sb-7a3f2d9e:~$ pip install -r requirements.txt", "info");
  setTimeout(() => {
    writeTerminal("Requirement already satisfied: numpy==2.0.0", "default");
    writeTerminal("Requirement already satisfied: matplotlib==3.9.0", "default");
    writeTerminal("Requirement already satisfied: pytest==8.2.0", "default");
    writeTerminal("All packages installed.", "success");
    toast.success("All packages are already installed.");
  }, 500);
}

function IdeShell() {
  const state = useIdeState();

  const runCommand = useCallback(
    (id: string) => {
      switch (id) {
        case "open":
          toast.info("File picker is disabled in this demo.");
          break;
        case "sandbox":
          toast.success(`Sandbox ${sandbox.id} is active and ready.`);
          break;
        case "run":
          runCurrentFile(state);
          break;
        case "install":
          installPackages();
          break;
        case "preview":
          toast.info("Opening port 3000 preview...");
          break;
        case "viz":
          toast.info("Visualization panel is bundled into the editor.");
          break;
        case "theme":
          toast("Already using dark theme.", {
            description: "Light mode is disabled for this demo.",
          });
          break;
        case "settings":
          toast.info("Settings panel coming soon.");
          break;
        default:
          break;
      }
    },
    [state],
  );

  // Global shortcuts
  useKeyboardShortcut({
    combo: "ctrl+shift+p",
    callback: () => state.setPaletteOpen(true),
  });
  useKeyboardShortcut({
    combo: "ctrl+s",
    callback: () => {
      if (state.activePath) {
        state.setDirty(state.activePath, false);
        toast.success(`Saved ${state.activePath.split("/").pop()}`);
      }
    },
  });
  useKeyboardShortcut({
    combo: "ctrl+r",
    callback: () => runCurrentFile(state),
  });
  useKeyboardShortcut({
    combo: "ctrl+b",
    callback: () => state.toggleSidebar(),
  });
  useKeyboardShortcut({
    combo: "ctrl+j",
    callback: () => state.toggleTerminal(),
  });
  useKeyboardShortcut({
    combo: "ctrl+shift+v",
    callback: () => toast.info("Opening port 3000 preview..."),
  });
  useKeyboardShortcut({
    combo: "ctrl+k ctrl+t",
    callback: () =>
      toast("Already using dark theme.", {
        description: "Light mode is disabled for this demo.",
      }),
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <ActivityBar
          active={state.sidebarPanel}
          onChange={state.setSidebarPanel}
        />
        {state.sidebarOpen && (
          <div className="hidden h-full w-[280px] shrink-0 md:block">
            <Sidebar />
          </div>
        )}
        <ErrorBoundary>
          <EditorArea />
        </ErrorBoundary>
      </div>
      <StatusBar />
      <CommandPalette
        open={state.paletteOpen}
        onOpenChange={state.setPaletteOpen}
        onRunCommand={runCommand}
      />
    </div>
  );
}

const Ide = () => (
  <IdeStateProvider>
    <ErrorBoundary>
      <IdeShell />
    </ErrorBoundary>
  </IdeStateProvider>
);

export default Ide;
