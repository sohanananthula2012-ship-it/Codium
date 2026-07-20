import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fileTree,
  type FileNode,
  getBreadcrumbs,
  getFileName,
} from "@/lib/ide-seed";

export type SidebarPanel = "explorer" | "search" | "source-control" | "run";
export type TerminalTab = "bash" | "output" | "problems";

export interface OpenTab {
  path: string;
  language: string;
  dirty: boolean;
}

export interface IdeContextValue {
  // Files & editor
  openTabs: OpenTab[];
  activePath: string | null;
  expandedFolders: Set<string>;
  setActiveFile: (path: string) => void;
  closeTab: (path: string) => void;
  toggleFolder: (id: string) => void;
  setDirty: (path: string, dirty: boolean) => void;

  // Panels
  sidebarPanel: SidebarPanel;
  setSidebarPanel: (panel: SidebarPanel) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  terminalOpen: boolean;
  toggleTerminal: () => void;
  activeTerminal: TerminalTab;
  setActiveTerminal: (tab: TerminalTab) => void;

  // Command palette
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  // Cursor
  cursor: { line: number; col: number };
  setCursor: (cursor: { line: number; col: number }) => void;

  // Helpers
  getActiveFileName: () => string;
  getActiveBreadcrumbs: () => string[];
  findNodeByPath: (path: string, root?: FileNode) => FileNode | undefined;
}

const IdeContext = createContext<IdeContextValue | null>(null);

const defaultExpanded = new Set<string>(["/project-alpha/src"]);

export function IdeStateProvider({ children }: { children: ReactNode }) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    { path: "src/app.py", language: "python", dirty: true },
    { path: "src/utils.py", language: "python", dirty: false },
  ]);
  const [activePath, setActivePath] = useState<string | null>("src/app.py");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    defaultExpanded,
  );
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>("explorer");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [activeTerminal, setActiveTerminal] = useState<TerminalTab>("bash");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cursor, setCursor] = useState({ line: 14, col: 32 });

  const setActiveFile = useCallback((path: string) => {
    setActivePath(path);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      const ext = path.split(".").pop() ?? "";
      const language = ext === "py" ? "python" : ext;
      return [...prev, { path, language, dirty: false }];
    });
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        if (activePath === path) {
          setActivePath(next.length > 0 ? next[next.length - 1].path : null);
        }
        return next;
      });
    },
    [activePath],
  );

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setDirty = useCallback((path: string, dirty: boolean) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, dirty } : t)),
    );
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const toggleTerminal = useCallback(() => setTerminalOpen((v) => !v), []);

  const findNodeByPath = useCallback(
    (path: string, root: FileNode = fileTree): FileNode | undefined => {
      if (root.path === path) return root;
      if (!root.children) return undefined;
      for (const child of root.children) {
        const found = findNodeByPath(path, child);
        if (found) return found;
      }
      return undefined;
    },
    [],
  );

  const getActiveFileName = useCallback(
    () => (activePath ? getFileName(activePath) : ""),
    [activePath],
  );

  const getActiveBreadcrumbs = useCallback(
    () => (activePath ? getBreadcrumbs(activePath) : []),
    [activePath],
  );

  const value = useMemo<IdeContextValue>(
    () => ({
      openTabs,
      activePath,
      expandedFolders,
      setActiveFile,
      closeTab,
      toggleFolder,
      setDirty,
      sidebarPanel,
      setSidebarPanel,
      sidebarOpen,
      toggleSidebar,
      terminalOpen,
      toggleTerminal,
      activeTerminal,
      setActiveTerminal,
      paletteOpen,
      setPaletteOpen,
      cursor,
      setCursor,
      getActiveFileName,
      getActiveBreadcrumbs,
      findNodeByPath,
    }),
    [
      openTabs,
      activePath,
      expandedFolders,
      setActiveFile,
      closeTab,
      toggleFolder,
      setDirty,
      sidebarPanel,
      sidebarOpen,
      toggleSidebar,
      terminalOpen,
      toggleTerminal,
      activeTerminal,
      paletteOpen,
      cursor,
      getActiveFileName,
      getActiveBreadcrumbs,
      findNodeByPath,
    ],
  );

  return <IdeContext.Provider value={value}>{children}</IdeContext.Provider>;
}

export function useIdeState(): IdeContextValue {
  const ctx = useContext(IdeContext);
  if (!ctx) {
    throw new Error("useIdeState must be used inside <IdeStateProvider>");
  }
  return ctx;
}
