import { lazy, Suspense } from "react";

const TerminalPane = lazy(() =>
  import("./TerminalPane").then((m) => ({ default: m.TerminalPane })),
);

export function Terminal() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[220px] items-center justify-center border-t border-border bg-background font-mono-code text-[12px] text-muted-foreground">
          Booting terminal…
        </div>
      }
    >
      <TerminalPane />
    </Suspense>
  );
}
