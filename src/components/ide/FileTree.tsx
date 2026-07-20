import { ChevronDown, ChevronRight, FileCode2, Folder } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIdeState } from "@/hooks/use-ide-state";
import { fileTree, type FileNode } from "@/lib/ide-seed";

const folderStyleByName: Record<string, string> = {
  src: "text-[#519aba]",
  tests: "text-[#519aba]",
  components: "text-[#519aba]",
};

const fileColorByExt: Record<string, string> = {
  py: "text-[#519aba]",
  css: "text-[#cca700]",
  md: "text-[#519aba]",
  txt: "text-[#a074c4]",
};

interface NodeRowProps {
  node: FileNode;
  depth: number;
}

function NodeRow({ node, depth }: NodeRowProps) {
  const {
    activePath,
    setActiveFile,
    expandedFolders,
    toggleFolder,
  } = useIdeState();
  const isFolder = node.kind === "folder";
  const expanded = isFolder && expandedFolders.has(node.path);
  const isActive = !isFolder && activePath === node.path;

  if (isFolder) {
    return (
      <div>
        <button
          onClick={() => toggleFolder(node.path)}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          className={cn(
            "group flex h-[22px] w-full items-center gap-1 text-left text-[13px] text-foreground/80 transition-colors",
            "hover:bg-muted/40",
          )}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Folder
            className={cn(
              "h-4 w-4",
              folderStyleByName[node.name] ?? "text-[#7aa6da]",
            )}
            fill="currentColor"
          />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <NodeRow key={child.id} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  const ext = node.name.split(".").pop() ?? "";
  const color = fileColorByExt[ext] ?? "text-muted-foreground";

  return (
    <button
      onClick={() => setActiveFile(node.path.replace("/project-alpha/", ""))}
      style={{ paddingLeft: `${8 + depth * 12 + 12}px` }}
      className={cn(
        "group flex h-[22px] w-full items-center gap-1.5 text-left text-[13px] transition-colors",
        "hover:bg-muted/40",
        isActive && "bg-primary/20 text-foreground",
        !isActive && "text-foreground/85",
      )}
    >
      <FileCode2 className={cn("h-4 w-4 shrink-0", color)} />
      <span className="truncate">{node.name}</span>
      {node.dirty && (
        <span
          aria-label="unsaved"
          className="ml-auto h-2 w-2 rounded-full bg-foreground/70"
        />
      )}
    </button>
  );
}

export function FileTree() {
  return (
    <div className="px-2 pb-2 pt-1 text-[13px]">
      <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Project — project-alpha
      </div>
      <div>
        {fileTree.children?.map((child) => (
          <NodeRow key={child.id} node={child} depth={0} />
        ))}
      </div>
    </div>
  );
}
