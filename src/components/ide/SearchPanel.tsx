import { ChevronRight, FileCode2, X } from "lucide-react";

import { searchResults } from "@/lib/ide-seed";
import { cn } from "@/lib/utils";

const fileColorByLang: Record<string, string> = {
  python: "text-[#519aba]",
};

export function SearchPanel() {
  return (
    <div className="flex h-full flex-col text-[13px]">
      <div className="px-2 pt-2">
        <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </div>
        <input
          type="text"
          defaultValue="generate_chart"
          className="w-full rounded border border-border bg-secondary/60 px-2 py-1 text-foreground outline-none focus:border-primary"
        />
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Include:</span>
          <span className="rounded bg-secondary/60 px-1.5 py-0.5">*.py</span>
          <span>Exclude:</span>
          <span className="rounded bg-secondary/60 px-1.5 py-0.5">
            node_modules
          </span>
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          {searchResults.length} results in {searchResults.length} files
        </div>
      </div>

      <div className="mt-1 flex-1 overflow-y-auto scrollbar-thin">
        {searchResults.map((group) => (
          <div key={group.id} className="mt-1">
            <div className="flex items-center gap-1 px-2 py-1 text-foreground/85">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <FileCode2
                className={cn(
                  "h-3.5 w-3.5",
                  fileColorByLang[group.language] ?? "text-muted-foreground",
                )}
              />
              <span className="font-mono-code text-[12px]">{group.file}</span>
            </div>
            {group.matches.map((m, idx) => (
              <button
                key={idx}
                className="flex w-full items-center gap-2 px-6 py-0.5 text-left font-mono-code text-[12px] text-foreground/85 hover:bg-muted/40"
              >
                <span className="w-6 shrink-0 text-right text-muted-foreground">
                  {m.line}
                </span>
                <span className="truncate">{m.text}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
