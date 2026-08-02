import { useState, useRef, useEffect } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { NewFileModal } from "./NewFileModal";
import { UploadModal } from "./UploadModal";
import { Search, Maximize2, Columns2, MoreHorizontal, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const MENUS: Record<string, string[]> = {
  File: ["New File", "Save", "Save All"],
  Edit: ["Undo", "Redo", "Cut", "Copy", "Paste"],
  Selection: ["Select All", "Expand Selection"],
  View: ["Explorer", "Search", "Source Control", "Terminal"],
  Go: ["Go to File", "Go to Line"],
  Run: ["Run Active File"],
  Terminal: ["New Terminal", "Toggle Terminal", "Maximize Panel"],
};

export function TitleBar() {
  const { setSidebarPanel, terminalVisible, setTerminalVisible, terminalMaximized, setTerminalMaximized, activePath, saveFile, saveAll } = useIdeState();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const runMenuItem = (menu: string, item: string) => {
    setOpenMenu(null);
    if (menu === "File" && item === "New File") setNewFileOpen(true);
    else if (menu === "File" && item === "Save") { if (activePath) saveFile(activePath); }
    else if (menu === "File" && item === "Save All") saveAll();
    else if (menu === "View" && item === "Explorer") setSidebarPanel("explorer");
    else if (menu === "View" && item === "Search") setSidebarPanel("search");
    else if (menu === "View" && item === "Source Control") setSidebarPanel("git");
    else if (menu === "View" && item === "Terminal") setTerminalVisible(true);
    else if (menu === "Terminal" && item === "New Terminal") setTerminalVisible(true);
    else if (menu === "Terminal" && item === "Toggle Terminal") setTerminalVisible(!terminalVisible);
    else if (menu === "Terminal" && item === "Maximize Panel") setTerminalMaximized(!terminalMaximized);
    // Other items are visual-fidelity placeholders for now.
  };

  return (
    <div ref={barRef} className="flex h-9 shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#323233] px-3 select-none">
      <div className="flex w-24 items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
      </div>

      <div className="flex items-center gap-0.5">
        {Object.keys(MENUS).map(menu => (
          <div key={menu} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
              className={cn(
                "rounded px-2 py-1 text-[12.5px] text-[#cccccc] hover:bg-[#3c3c3c]",
                openMenu === menu && "bg-[#3c3c3c] text-white"
              )}
            >
              {menu}
            </button>
            {openMenu === menu && (
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded border border-[#454545] bg-[#252526] py-1 shadow-2xl">
                {MENUS[menu].map(item => (
                  <button
                    key={item}
                    onClick={() => runMenuItem(menu, item)}
                    className="block w-full px-3 py-1.5 text-left text-[12.5px] text-[#cccccc] hover:bg-[#04395e] hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button className="rounded px-2 py-1 text-[12.5px] text-[#cccccc] hover:bg-[#3c3c3c]">Help</button>
        <button
          onClick={() => setUploadOpen(true)}
          className="ml-1 flex items-center gap-1.5 rounded px-2 py-1 text-[12.5px] text-[#cccccc] hover:bg-[#3c3c3c]"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>

      <div className="flex w-24 items-center justify-end gap-3 text-[#a0a0a0]">
        <button onClick={() => setSidebarPanel("search")} title="Search" className="hover:text-white">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button title="Fullscreen" className="hover:text-white">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button title="Split editor" className="hover:text-white">
          <Columns2 className="h-3.5 w-3.5" />
        </button>
        <button title="More" className="hover:text-white">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <NewFileModal open={newFileOpen} onClose={() => setNewFileOpen(false)} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
