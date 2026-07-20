import { ChevronRight } from "lucide-react";
import { useIdeState } from "@/hooks/use-ide-state";

export function Breadcrumbs() {
  const { getActiveBreadcrumbs } = useIdeState();
  const crumbs = getActiveBreadcrumbs();

  if (crumbs.length === 0) {
    return <div className="h-7 border-b border-border bg-card/40" />;
  }

  return (
    <div className="flex h-7 shrink-0 items-center gap-1 border-b border-border bg-card/40 px-3 text-[12px]">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={
                isLast
                  ? "font-mono-code text-foreground"
                  : "font-mono-code text-muted-foreground hover:text-foreground"
              }
            >
              {crumb}
            </span>
          </span>
        );
      })}
    </div>
  );
}
