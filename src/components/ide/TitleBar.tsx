export function TitleBar() {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#2d2d30] px-3 select-none">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
      </div>
      <span className="text-sm text-[#cccccc]">Codium</span>
      <div className="w-16" />
    </div>
  );
}
