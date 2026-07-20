import { Maximize2, Minimize2, MoreHorizontal, Search } from "lucide-react";

const menuItems = [
  "File",
  "Edit",
  "Selection",
  "View",
  "Go",
  "Run",
  "Terminal",
  "Help",
];

export function TitleBar() {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-titlebar px-2 select-none">
      {/* Window controls (macOS-style dots) */}
      <div className="flex items-center gap-2">
        <span
          aria-label="close"
          className="h-3 w-3 rounded-full bg-[hsl(0,70%,55%)]"
        />
        <span
          aria-label="minimize"
          className="h-3 w-3 rounded-full bg-[hsl(38,90%,55%)]"
        />
        <span
          aria-label="maximize"
          className="h-3 w-3 rounded-full bg-[hsl(120,60%,50%)]"
        />
      </div>

      {/* Menu */}
      <nav className="flex items-center gap-1 text-[12px] text-muted-foreground">
        {menuItems.map((item) => (
          <button
            key={item}
            className="rounded px-2 py-0.5 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Window actions */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <button
          aria-label="Search"
          className="rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          aria-label="Maximize"
          className="rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          aria-label="Minimize"
          className="rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
        <button
          aria-label="More"
          className="rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
