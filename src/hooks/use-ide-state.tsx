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
  saveAll: () => Promise<void>;
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
  sandboxUnlocked: boolean;
  unlockSandbox: (password: string) => boolean;

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
  const [sandboxUnlocked, setSandboxUnlocked] = useState(false);
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
    setSandboxUnlocked(false);
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
    setSandboxUnlocked(
      r ? localStorage.getItem(`codium_unlocked_${r.owner}_${r.name}`) === "true" : false
    );
  }, []);

  const unlockSandbox = useCallback(
    (password: string) => {
      if (password !== "I-AM-SOHAN-252") return false;
      if (repo) localStorage.setItem(`codium_unlocked_${repo.owner}_${repo.name}`, "true");
      setSandboxUnlocked(true);
      return true;
    },
    [repo]
  );

  const refreshTree = useCallback(async () => {
    if (!sandboxId || !repoDir) return;
    setTreeLoading(true);
    try {
      const result = await DaytonaClient.exec(
        sandboxId,
        `find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './dist/*' -not -path './build/*' -not -path './.next/*' | sed 's|^\\./||'`,
        repoDir
      );
      const paths = result.output
        .split("\n")
        .map(p => p.trim())
        .filter(Boolean);
      setTree(paths.map(path => ({ path, type: "blob" as const, mode: "100644", sha: "" })));
    } catch (err: any) {
      toast.error(err.message || "Failed to list sandbox files");
    } finally {
      setTreeLoading(false);
    }
  }, [sandboxId, repoDir]);

  // Files now come from the live sandbox filesystem, not GitHub — it's the
  // sandbox that's the source of truth day-to-day, GitHub is just where you
  // push to when you're ready to commit.
  useEffect(() => {
    if (sandboxStatus === "ready") refreshTree();
  }, [sandboxStatus, refreshTree]);

  const openFile = useCallback(
    async (path: string) => {
      if (!sandboxId || !repoDir) return;

      const existing = openTabs.find(t => t.path === path);
      if (existing) {
        setActivePath(path);
        return;
      }

      try {
        const result = await DaytonaClient.exec(sandboxId, `cat "${path}"`, repoDir);
        if (result.exitCode !== 0) throw new Error(result.output || `Couldn't read ${path}`);
        setOpenTabs(prev => [
          ...prev,
          { path, content: result.output, originalContent: result.output, dirty: false },
        ]);
        setActivePath(path);
      } catch (err: any) {
        toast.error(err.message || `Failed to open ${path}`);
      }
    },
    [sandboxId, repoDir, openTabs]
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
        // We no longer fetch this on open (files come from the sandbox now),
        // so resolve it here — if the file already exists on GitHub, pushing
        // without its current sha would get rejected as a conflict.
        const sha = tab.sha ?? (await gh.getFileSha(repo.owner, repo.name, path, repo.branch));
        const result = await gh.createOrUpdateFile(
          repo.owner,
          repo.name,
          path,
          tab.content,
          `Update ${path.split("/").pop()}`,
          sha,
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

  const saveAll = useCallback(async () => {
    const dirtyPaths = openTabs.filter(t => t.dirty).map(t => t.path);
    if (dirtyPaths.length === 0) return;
    for (const path of dirtyPaths) {
      await saveFile(path);
    }
  }, [openTabs, saveFile]);

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

      if (sandboxStatus === "ready" && sandboxId && repoDir) {
        DaytonaClient.exec(sandboxId, `mkdir -p "$(dirname "${cleanPath}")" && touch "${cleanPath}"`, repoDir).catch(
          () => toast.error(`Couldn't create ${cleanPath} in the sandbox`)
        );
      }
    },
    [tree, openTabs, sandboxStatus, sandboxId, repoDir]
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
      if (!handle.isUniversal) {
        toast.success(
          `Sandbox ready: ${handle.sandboxId} — set DAYTONA_SANDBOX_ID in Vercel to make this the one sandbox you always reconnect to`,
          { duration: 8000 }
        );
      }
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
    saveAll,
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
    sandboxUnlocked,
    unlockSandbox,
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
