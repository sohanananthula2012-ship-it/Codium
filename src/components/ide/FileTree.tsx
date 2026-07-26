import { useMemo, useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { ChevronRight, ChevronDown, File, Folder, Loader2 } from "lucide-react";
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

export function FileTree() {
  const { tree, treeLoading, repo } = useIdeState();

  const nodes = useMemo(() => buildTree(tree.map(t => t.path)), [tree]);

  if (treeLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#007acc]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-3 py-2 text-[11px] font-bold uppercase text-[#858585]">
        {repo ? `${repo.owner}/${repo.name}` : "Explorer"}
      </div>
      {nodes.map(node => (
        <TreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
