import { useMemo, useState, useRef } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Loader2,
  FilePlus,
  Upload,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderNode {
  type: "folder";
  name: string;
  path: string;
  children: Node[];
}
interface FileNode {
  type: "file";
  name: string;
  path: string;
}
type Node = FolderNode | FileNode;

function buildTree(paths: string[]): Node[] {
  const root: FolderNode = { type: "folder", name: "", path: "", children: [] };

  for (const fullPath of paths) {
    const parts = fullPath.split("/");
    let cursor = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      if (isFile) {
        cursor.children.push({ type: "file", name: part, path: acc });
        return;
      }
      let next = cursor.children.find(
        c => c.type === "folder" && c.name === part
      ) as FolderNode | undefined;
      if (!next) {
        next = { type: "folder", name: part, path: acc, children: [] };
        cursor.children.push(next);
      }
      cursor = next;
    });
  }

  const sortNode = (n: FolderNode) => {
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(c => c.type === "folder" && sortNode(c));
  };
  sortNode(root);

  return root.children;
}

function TreeNode({ node, depth }: { node: Node; depth: number }) {
  const { openFile, activePath } = useIdeState();
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.type === "file") {
    const isActive = activePath === node.path;
    return (
      <div
        onClick={() => openFile(node.path)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 py-1 pr-2 text-[13px] hover:bg-[#2a2d2e]",
          isActive ? "bg-[#37373d] text-white" : "text-[#cccccc]"
        )}
      >
        <File className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        className="flex cursor-pointer items-center gap-1 py-1 pr-2 text-[13px] text-[#cccccc] hover:bg-[#2a2d2e]"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
        )}
        <Folder className="h-3.5 w-3.5 shrink-0 text-[#007acc]" />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded &&
        node.children.map(child => (
          <TreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

// Extract Google Drive file ID from various link formats
function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /([a-zA-Z0-9_-]{25,})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Convert Google Drive link to direct download URL
function getDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function FileTree() {
  const { tree, treeLoading, repo, createFile, uploadFile } = useIdeState();
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [gdriveMode, setGdriveMode] = useState(false);
  const [gdriveUrl, setGdriveUrl] = useState("");
  const [gdriveDownloading, setGdriveDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodes = useMemo(() => buildTree(tree.map(t => t.path)), [tree]);

  const handleCreateFile = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newFileName.trim()) {
      setCreating(false);
      const name = newFileName.trim();
      setNewFileName("");
      await createFile(name);
    } else if (e.key === "Escape") {
      setCreating(false);
      setNewFileName("");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !repo) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await uploadFile(file.name, base64);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleGdriveDownload = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !gdriveUrl.trim() || !repo) return;

    const fileId = extractDriveFileId(gdriveUrl.trim());
    if (!fileId) {
      alert("Invalid Google Drive link. Please provide a valid shareable link.");
      return;
    }

    setGdriveDownloading(true);
    try {
      const downloadUrl = getDriveDownloadUrl(fileId);

      // Fetch the file from Google Drive
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Failed to download from Google Drive");

      const blob = await response.blob();

      // Try to get filename from Content-Disposition header
      let fileName = "downloaded-file";
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) fileName = match[1].replace(/['"]/g, "");
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await uploadFile(fileName, base64);
        setGdriveUrl("");
        setGdriveMode(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      alert(err.message || "Failed to download from Google Drive");
    } finally {
      setGdriveDownloading(false);
    }
  };

  if (treeLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#007acc]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header with action icons */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-bold uppercase text-[#858585]">
          {repo ? `${repo.owner}/${repo.name}` : "Explorer"}
        </span>
        {repo && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCreating(true)}
              title="New File"
              className="rounded p-0.5 text-[#858585] hover:bg-[#2a2d2e] hover:text-white"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
              className="rounded p-0.5 text-[#858585] hover:bg-[#2a2d2e] hover:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setGdriveMode(true)}
              title="Download from Google Drive"
              className="rounded p-0.5 text-[#858585] hover:bg-[#2a2d2e] hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        )}
      </div>

      {/* New file input */}
      {creating && (
        <div className="mx-2 mb-1 flex items-center gap-1.5 rounded bg-[#252526] px-2 py-1">
          <File className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
          <input
            autoFocus
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={handleCreateFile}
            onBlur={() => {
              setCreating(false);
              setNewFileName("");
            }}
            placeholder="filename.ext"
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#5a5a5a]"
          />
        </div>
      )}

      {/* Google Drive download input */}
      {gdriveMode && (
        <div className="mx-2 mb-1 flex items-center gap-1.5 rounded bg-[#252526] px-2 py-1">
          {gdriveDownloading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#007acc]" />
          ) : (
            <Download className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
          )}
          <input
            autoFocus
            value={gdriveUrl}
            onChange={e => setGdriveUrl(e.target.value)}
            onKeyDown={handleGdriveDownload}
            onBlur={() => {
              if (!gdriveDownloading) {
                setGdriveMode(false);
                setGdriveUrl("");
              }
            }}
            placeholder="Paste Google Drive link..."
            disabled={gdriveDownloading}
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#5a5a5a] disabled:opacity-50"
          />
        </div>
      )}

      {nodes.map(node => (
        <TreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
