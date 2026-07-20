import { FileCode2 } from "lucide-react";
import { toast } from "sonner";

import { sourceChanges } from "@/lib/ide-seed";
import { cn } from "@/lib/utils";

const fileColorByExt: Record<string, string> = {
  py: "text-[#519aba]",
};

const statusStyle: Record<string, string> = {
  M: "bg-warning/20 text-warning",
  A: "bg-success/20 text-success",
  D: "bg-destructive/20 text-destructive",
};

export function SourceControl() {
  return (
    <div className="flex h-full flex-col text-[13px]">
      <div className="px-2 pt-2">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Source Control
        </div>
        <div className="px-2 pb-2 text-[11px] text-muted-foreground">
          project-alpha · main
        </div>
      </div>

      <div className="px-2">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Changes ({sourceChanges.length})
        </div>
        <div className="space-y-0.5">
          {sourceChanges.map((change) => {
            const ext = change.path.split(".").pop() ?? "";
            return (
              <div
                key={change.id}
                className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/40"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold",
                    statusStyle[change.status],
                  )}
                >
                  {change.status}
                </span>
                <FileCode2
                  className={cn(
                    "h-3.5 w-3.5",
                    fileColorByExt[ext] ?? "text-muted-foreground",
                  )}
                />
                <span className="truncate font-mono-code text-[12px] text-foreground/85">
                  {change.path}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  +{change.added} -{change.removed}
                </span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success/70"
                    style={{ width: `${change.fill * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 px-2">
        <input
          type="text"
          placeholder="feat: add card component with Daytona analytics..."
          className="w-full rounded border border-border bg-secondary/60 px-2 py-1.5 text-foreground outline-none focus:border-primary"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={() => toast.info("Changes discarded.")}
            className="rounded border border-border bg-secondary px-3 py-1 text-[12px] text-foreground/85 hover:bg-muted"
          >
            Discard
          </button>
          <button
            onClick={() =>
              toast.success(
                `Committed ${sourceChanges.length} files to main.`,
              )
            }
            className="rounded bg-primary px-3 py-1 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Commit
          </button>
        </div>
      </div>
    </div>
  );
}
