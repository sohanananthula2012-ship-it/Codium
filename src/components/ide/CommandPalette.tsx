import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { commands } from "@/lib/ide-seed";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunCommand: (id: string) => void;
}

export function CommandPalette({ open, onOpenChange, onRunCommand }: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    } else {
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(0);
  }, [results.length, activeIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="left-1/2 top-[12vh] max-w-[560px] -translate-x-1/2 translate-y-0 gap-0 border-border bg-card p-0 text-foreground [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = results[activeIndex];
                if (item) {
                  onRunCommand(item.id);
                  onOpenChange(false);
                }
              }
            }}
            placeholder="Type a command..."
            className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
              No commands matching “{query}”.
            </div>
          ) : (
            results.map((cmd, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onRunCommand(cmd.id);
                    onOpenChange(false);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors",
                    isActive
                      ? "bg-primary/20 text-foreground"
                      : "text-foreground/85 hover:bg-muted/40",
                  )}
                >
                  <div className="flex flex-col">
                    <span>{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-[11px] text-muted-foreground">
                        {cmd.description}
                      </span>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <span className="ml-3 shrink-0 font-mono-code text-[11px] text-muted-foreground">
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
