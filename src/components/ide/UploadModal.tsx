import { useState } from "react";
import { Modal } from "./Modal";
import { useIdeState } from "@/hooks/use-ide-state";
import { DaytonaClient } from "@/lib/daytona";
import { GitHubAPI } from "@/lib/github";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

export function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token, repo, sandboxId, repoDir, sandboxStatus, refreshTree } = useIdeState();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!url.trim() || !repo) return;
    if (sandboxStatus !== "ready" || !sandboxId || !repoDir) {
      toast.error("Connect the Daytona sandbox first (Bash tab) before importing files");
      return;
    }

    setBusy(true);
    try {
      const { filename, contentBase64 } = await DaytonaClient.importFromDrive(sandboxId, repoDir, url.trim());

      const gh = new GitHubAPI(token);
      await gh.createOrUpdateFile(
        repo.owner,
        repo.name,
        filename,
        contentBase64,
        `Add ${filename} from Google Drive`,
        undefined,
        repo.branch,
        true // isBase64
      );

      await refreshTree();
      toast.success(`Imported ${filename}`);
      setUrl("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import from Google Drive">
      <label className="mb-1.5 block text-[12px] text-[#a1a1a1]">Shareable Google Drive link</label>
      <input
        autoFocus
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
        className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#555] focus:border-[#007acc]"
      />
      <p className="mt-2 text-[12px] text-[#666]">
        The link needs "Anyone with the link" sharing turned on. The file downloads into your
        sandbox and gets committed to the repo.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#3c3c3c]">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="flex items-center gap-1.5 rounded bg-[#007acc] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#0066aa] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          Import
        </button>
      </div>
    </Modal>
  );
}
