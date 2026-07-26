import { useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { GitCommit, Loader2, FileEdit } from "lucide-react";
import { toast } from "sonner";

export function GitPanel() {
  const { repo, openTabs, saveFile } = useIdeState();
  const [pushing, setPushing] = useState<string | null>(null);
  const [pushingAll, setPushingAll] = useState(false);

  const dirtyFiles = openTabs.filter(t => t.dirty);

  const pushFile = async (path: string) => {
    setPushing(path);
    try {
      await saveFile(path);
    } finally {
      setPushing(null);
    }
  };

  const pushAll = async () => {
    if (dirtyFiles.length === 0) return;
    setPushingAll(true);
    try {
      for (const tab of dirtyFiles) {
        await saveFile(tab.path);
      }
      toast.success("All changes pushed");
    } finally {
      setPushingAll(false);
    }
  };

  if (!repo) return <div className="p-3 text-sm text-[#858585]">No repo</div>;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-2 text-[11px] font-bold uppercase text-[#858585]">Source Control</div>
      <div className="mb-2 text-sm text-[#cccccc]">{repo.owner}/{repo.name}</div>

      {dirtyFiles.length > 0 ? (
        <div className="mb-3 space-y-1">
          <div className="mb-1 text-[11px] text-[#858585]">Changes ({dirtyFiles.length})</div>
          {dirtyFiles.map(f => (
            <div key={f.path} className="flex items-center gap-2 py-1 text-[12px]">
              <FileEdit className="h-3 w-3 shrink-0 text-[#cca700]" />
              <span className="flex-1 truncate text-[#cccccc]">{f.path.split("/").pop()}</span>
              <button
                onClick={() => pushFile(f.path)}
                disabled={pushing === f.path}
                className="rounded px-1.5 py-0.5 text-[11px] text-[#007acc] hover:bg-[#3c3c3c] disabled:opacity-50"
              >
                {pushing === f.path ? <Loader2 className="h-3 w-3 animate-spin" /> : "Push"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[#858585]">No changes</p>
      )}

      <div className="mt-auto space-y-2">
        <button
          onClick={pushAll}
          disabled={dirtyFiles.length === 0 || pushingAll}
          className="flex w-full items-center justify-center gap-2 rounded bg-[#007acc] py-1.5 text-[12px] font-medium text-white hover:bg-[#0066aa] disabled:opacity-40"
        >
          {pushingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCommit className="h-3.5 w-3.5" />}
          Push all changes
        </button>
        <p className="text-[11px] text-[#858585]">
          Each save creates its own commit on <span className="text-[#cccccc]">{repo.branch}</span>.
        </p>
      </div>
    </div>
  );
}
