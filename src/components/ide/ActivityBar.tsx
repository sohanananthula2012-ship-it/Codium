import {
  Bug,
  Files,
  GitBranch,
  Puzzle,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { SidebarPanel } from "@/hooks/use-ide-state";

interface ActivityItem {
  id: SidebarPanel;
  label: string;
  icon: LucideIcon;
}

const items: ActivityItem[] = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "source-control", label: "Source Control", icon: GitBranch },
  { id: "run", label: "Run and Debug", icon: Bug },
];

interface Props {
  active: SidebarPanel;
  onChange: (panel: SidebarPanel) => void;
}

export function ActivityBar({ active, onChange }: Props) {
  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-activitybar py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-pressed={isActive}
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded text-muted-foreground transition-colors",
              "hover:text-foreground",
              isActive && "text-foreground",
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r bg-primary" />
            )}
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
      <div className="mt-auto">
        <button
          title="Extensions"
          aria-label="Extensions"
          className="flex h-10 w-10 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
        >
          <Puzzle className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
