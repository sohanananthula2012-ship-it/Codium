import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { GitHubAPI, type TreeItem } from "@/lib/github";
import { DaytonaClient } from "@/lib/daytona";
import { toast } from "sonner";

export interface RepoRef {
  owner: string;
  name: string;
  branch: string;
}

export interface Tab {
  path: string;
  content: string;
  originalContent: string;
  sha?: string;
  dirty: boolean;
}

export type SidebarPanel = "explorer" | "search" | "git" | "npm";
export type SandboxStatus = "idle" | "connecting" | "ready" | "error";
export interface CursorPosition {
  line: number;
  column: number;
}
export interface OpenPort {
  port: number;
  url?: string;
}

interface IdeState {
  token: string;
  setToken: (token: string) => void;
  logout: () => void;

  repo: RepoRef | null;
  setRepo: (repo: RepoRef | null) => void;

  tree: TreeItem[];
  treeLoading: boolean;
  refreshTree: () => Promise<void>;

  openTabs: Tab[];
  activePath: string | null;
  openFile: (path: string) => Promise<void>;
  setActiveFile: (path: string) => void;
  closeTab: (path: string) => void;
  updateTabContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  createFile: (path: string) => void;

  cursorPosition: CursorPosition;
  setCursorPosition: (pos: CursorPosition) => void;

  sidebarPanel: SidebarPanel;
  setSidebarPanel: (panel: SidebarPanel) => void;

  sandboxId: string | null;
  repoDir: string | null;
  wsUrl: string | null;
  sandboxStatus: SandboxStatus;
  connectSandbox: () => Promise<void>;

  openPorts: OpenPort[];
  reportPort: (port: number) => void;
  getPortPreviewUrl: (port: number) => Promise<string>;

  terminalVisible: boolean;
  setTerminalVisible: (v: boolean) => void;
  terminalMaximized: boolean;
  setTerminalMaximized: (v: boolean) => void;
}

const IdeContext = createContext<IdeState | null>(null);

export function IdeProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState("");
  const [repo, setRepoState] = useState<RepoRef | null>(null);
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>("explorer");

  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [repoDir, setRepoDir] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>("idle");
  const writeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
  const [openPorts, setOpenPorts] = useState<OpenPort[]>([]);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [terminalMaximized, setTerminalMaximized] = useState(false);

  // Restore token from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem("gh_token");
    if (saved) setTokenState(saved);
  }, []);

  const setToken = useCallback((t: string) => {
    setTokenState(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("gh_token");
    setTokenState("");
    setRepoState(null);
    setTree([]);
    setOpenTabs([]);
    setActivePath(null);
    setSandboxId(null);
    setRepoDir(null);
    setWsUrl(null);
    setSandboxStatus("idle");
    setOpenPorts([]);
  }, []);

  const setRepo = useCallback((r: RepoRef | null) => {
    setRepoState(r);
    setOpenTabs([]);
    setActivePath(null);
    setSandboxId(null);
    setRepoDir(null);
    setWsUrl(null);
    setSandboxStatus("idle");
    setOpenPorts([]);
  }, []);

  const refreshTree = useCallback(async () => {
    if (!repo || !token) return;
    setTreeLoading(true);
    try {
      const gh = new GitHubAPI(token);
      const items = await gh.getTree(repo.owner, repo.name, repo.branch);
      setTree(items.filter(i => i.type === "blob"));
    } catch (err: any) {
      toast.error(err.message || "Failed to load repo tree");
    } finally {
      setTreeLoading(false);
    }
  }, [repo, token]);

  useEffect(() => {
    if (repo && token) refreshTree();
  }, [repo, token, refreshTree]);

  const openFile = useCallback(
    async (path: string) => {
      if (!repo || !token) return;

      const existing = openTabs.find(t => t.path === path);
      if (existing) {
        setActivePath(path);
        return;
      }

      try {
        const gh = new GitHubAPI(token);
        const [content, sha] = await Promise.all([
          gh.getFile(repo.owner, repo.name, path, repo.branch),
          gh.getFileSha(repo.owner, repo.name, path, repo.branch),
        ]);
        setOpenTabs(prev => [
          ...prev,
          { path, content, originalContent: content, sha, dirty: false },
        ]);
        setActivePath(path);
      } catch (err: any) {
        toast.error(err.message || `Failed to open ${path}`);
      }
    },
    [repo, token, openTabs]
  );

  const setActiveFile = useCallback((path: string) => {
    setActivePath(path);
  }, []);

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs(prev => {
        const next = prev.filter(t => t.path !== path);
        if (activePath === path) {
          setActivePath(next.length > 0 ? next[next.length - 1].path : null);
        }
        return next;
      });
    },
    [activePath]
  );

  const updateTabContent = useCallback(
    (path: string, content: string) => {
      setOpenTabs(prev =>
        prev.map(t =>
          t.path === path
            ? { ...t, content, dirty: content !== t.originalContent }
            : t
        )
      );

      if (sandboxStatus === "ready" && sandboxId && repoDir) {
        clearTimeout(writeTimers.current[path]);
        writeTimers.current[path] = setTimeout(() => {
          DaytonaClient.write(sandboxId, repoDir, path, content).catch(() => {
            toast.error(`Sandbox sync failed for ${path.split("/").pop()}`);
          });
        }, 800);
      }
    },
    [sandboxStatus, sandboxId, repoDir]
  );

  const saveFile = useCallback(
    async (path: string) => {
      if (!repo || !token) return;
      const tab = openTabs.find(t => t.path === path);
      if (!tab || !tab.dirty) return;

      try {
        const gh = new GitHubAPI(token);
        const result = await gh.createOrUpdateFile(
          repo.owner,
          repo.name,
          path,
          tab.content,
          `Update ${path.split("/").pop()}`,
          tab.sha,
          repo.branch
        );
        setOpenTabs(prev =>
          prev.map(t =>
            t.path === path
              ? {
                  ...t,
                  originalContent: t.content,
                  dirty: false,
                  sha: result?.content?.sha ?? t.sha,
                }
              : t
          )
        );
        toast.success(`Pushed ${path.split("/").pop()}`);
      } catch (err: any) {
        toast.error(err.message || `Failed to push ${path}`);
      }
    },
    [repo, token, openTabs]
  );

  const createFile = useCallback(
    (path: string) => {
      const cleanPath = path.trim().replace(/^\/+/, "");
      if (!cleanPath) return;
      if (tree.some(t => t.path === cleanPath) || openTabs.some(t => t.path === cleanPath)) {
        toast.error(`${cleanPath} already exists`);
        return;
      }
      setTree(prev => [...prev, { path: cleanPath, mode: "100644", type: "blob", sha: "" }]);
      setOpenTabs(prev => [
        ...prev,
        { path: cleanPath, content: "", originalContent: "", dirty: true },
      ]);
      setActivePath(cleanPath);
    },
    [tree, openTabs]
  );

  const reportPort = useCallback((port: number) => {
    setOpenPorts(prev => (prev.some(p => p.port === port) ? prev : [...prev, { port }]));
  }, []);

  const getPortPreviewUrl = useCallback(
    async (port: number) => {
      if (!sandboxId) throw new Error("No sandbox connected");
      const existing = openPorts.find(p => p.port === port)?.url;
      if (existing) return existing;
      const { url } = await DaytonaClient.previewPort(sandboxId, port);
      setOpenPorts(prev => prev.map(p => (p.port === port ? { ...p, url } : p)));
      return url;
    },
    [sandboxId, openPorts]
  );

  const connectSandbox = useCallback(async () => {
    if (!repo || !token) return;
    setSandboxStatus("connecting");
    try {
      const handle = await DaytonaClient.create(repo.owner, repo.name, repo.branch, token);
      setSandboxId(handle.sandboxId);
      setRepoDir(handle.repoDir);
      setWsUrl(handle.wsUrl);
      setSandboxStatus("ready");
    } catch (err: any) {
      setSandboxStatus("error");
      toast.error(err.message || "Failed to connect to Daytona sandbox");
    }
  }, [repo, token]);

  const value: IdeState = {
    token,
    setToken,
    logout,
    repo,
    setRepo,
    tree,
    treeLoading,
    refreshTree,
    openTabs,
    activePath,
    openFile,
    setActiveFile,
    closeTab,
    updateTabContent,
    saveFile,
    createFile,
    cursorPosition,
    setCursorPosition,
    sidebarPanel,
    setSidebarPanel,
    sandboxId,
    repoDir,
    wsUrl,
    sandboxStatus,
    connectSandbox,
    openPorts,
    reportPort,
    getPortPreviewUrl,
    terminalVisible,
    setTerminalVisible,
    terminalMaximized,
    setTerminalMaximized,
  };

  return <IdeContext.Provider value={value}>{children}</IdeContext.Provider>;
}

export function useIdeState(): IdeState {
  const ctx = useContext(IdeContext);
  if (!ctx) throw new Error("useIdeState must be used within an IdeProvider");
  return ctx;
}
