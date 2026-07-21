import { useState, useEffect } from "react";
import { GitHubAPI } from "@/lib/github";
import { useIdeState } from "@/hooks/use-ide-state";
import { GitCommit, GitPush, Loader2, FileEdit } from "lucide-react";
import { toast } from "sonner";

export function GitPanel() {
  const { repo, token, openTabs } = useIdeState();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState<string | null>(null);

  // Dirty files from open tabs
  const dirtyFiles = openTabs.filter(t => t.dirty);

  const pushFile = async (path: string) => {
    if (!repo) return;
    setPushing(path);
    try {
      const gh = new GitHubAPI(token);
      // Get file content from editor - we need to track this better
      // For now, this is a placeholder - the actual save happens in MonacoEditor
      toast.info(`Push ${path} via Ctrl+S in editor`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPushing(null);
    }
  };

  const pushAll = async () => {
    if (!repo || !message.trim() || dirtyFiles.length === 0) return;
    setLoading(true);
    try {
      const gh = new GitHubAPI(token);

      // For each dirty file, we need to push it
      // But we don't have the content here - it's in MonacoEditor
      // So we tell the user to save each file individually

      toast.info("Save each file with Ctrl+S, then push commits");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!repo) return <div className="p-3 text-sm text-[#858585]">No repo</div>;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 text-[11px] font-bold uppercase text-[#858585]">Source Control</div>
      <div className="mb-2 text-sm text-[#cccccc]">{repo.owner}/{repo.name}</div>

      {dirtyFiles.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[11px] text-[#858585]">Changes ({dirtyFiles.length})</div>
          {dirtyFiles.map(f => (
            <div key={f.path} className="flex items-center gap-2 py-1 text-[12px]">
              <FileEdit className="h-3 w-3 text-[#cca700]" />
              <span className="text-[#cccccc]">{f.path.split("/").pop()}</span>
              <span className="text-[#858585]">M</span>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Commit message..."
        className="mb-2 h-20 resize-none rounded border border-[#3c3c3c] bg-[#1e1e1e] p-2 text-[12px] text-white outline-none focus:border-[#007acc]"
      />

      <div className="mt-auto space-y-2">
        <p className="text-[11px] text-[#858585]">
          Press <kbd className="rounded bg-[#3c3c3c] px-1">Ctrl+S</kbd> in editor to push each file
        </p>
      </div>
    </div>
  );
}
