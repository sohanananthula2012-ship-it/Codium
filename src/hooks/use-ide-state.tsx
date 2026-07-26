import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { GitHubAPI, type TreeItem } from "@/lib/github";
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

export type SidebarPanel = "explorer" | "git";

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

  sidebarPanel: SidebarPanel;
  setSidebarPanel: (panel: SidebarPanel) => void;
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
  }, []);

  const setRepo = useCallback((r: RepoRef | null) => {
    setRepoState(r);
    setOpenTabs([]);
    setActivePath(null);
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

  const updateTabContent = useCallback((path: string, content: string) => {
    setOpenTabs(prev =>
      prev.map(t =>
        t.path === path
          ? { ...t, content, dirty: content !== t.originalContent }
          : t
      )
    );
  }, []);

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
    sidebarPanel,
    setSidebarPanel,
  };

  return <IdeContext.Provider value={value}>{children}</IdeContext.Provider>;
}

export function useIdeState(): IdeState {
  const ctx = useContext(IdeContext);
  if (!ctx) throw new Error("useIdeState must be used within an IdeProvider");
  return ctx;
}
