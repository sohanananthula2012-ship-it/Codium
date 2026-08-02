import { useState } from "react";
import { Modal } from "./Modal";
import { useIdeState } from "@/hooks/use-ide-state";

export function NewFileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createFile } = useIdeState();
  const [path, setPath] = useState("");

  const submit = () => {
    if (!path.trim()) return;
    createFile(path);
    setPath("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New File">
      <label className="mb-1.5 block text-[12px] text-[#a1a1a1]">
        Path (relative to repo root)
      </label>
      <input
        autoFocus
        value={path}
        onChange={e => setPath(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="src/components/NewComponent.tsx"
        className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 font-mono text-[13px] text-white outline-none placeholder:text-[#555] focus:border-[#007acc]"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#3c3c3c]"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="rounded bg-[#007acc] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#0066aa]"
        >
          Create File
        </button>
      </div>
    </Modal>
  );
}
