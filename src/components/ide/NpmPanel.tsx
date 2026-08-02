import { useEffect, useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { DaytonaClient } from "@/lib/daytona";
import { Search, Package, Loader2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NpmResult {
  name: string;
  version: string;
  description?: string;
}

export function NpmPanel() {
  const { sandboxId, sandboxStatus, repoDir } = useIdeState();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NpmResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=15`
        );
        const data = await res.json();
        setResults(
          (data.objects || []).map((o: any) => ({
            name: o.package.name,
            version: o.package.version,
            description: o.package.description,
          }))
        );
      } catch {
        toast.error("npm registry search failed");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  const install = async (name: string) => {
    if (!sandboxId) {
      toast.error("Connect the Daytona sandbox first (Bash tab) to install packages");
      return;
    }
    setInstalling(name);
    try {
      const result = await DaytonaClient.exec(sandboxId, `npm install ${name} --save`, repoDir ?? undefined);
      if (result.exitCode === 0) {
        setInstalled(prev => new Set(prev).add(name));
        toast.success(`Installed ${name}`);
      } else {
        toast.error(`npm install ${name} exited with code ${result.exitCode}`);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to install ${name}`);
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2 text-[11px] font-bold uppercase text-[#858585]">npm Packages</div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#666]" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search npm registry..."
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#555]"
          />
          {searching && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#666]" />}
        </div>
        {sandboxStatus !== "ready" && (
          <p className="mt-1.5 text-[11px] text-[#cca700]">Connect the sandbox (Bash tab) to install packages.</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.map(pkg => (
          <div key={pkg.name} className="border-b border-[#2a2a2a] px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-1.5">
                <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#cb3837]" />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-[13px] font-medium text-white">{pkg.name}</span>
                    <span className="shrink-0 text-[11px] text-[#666]">{pkg.version}</span>
                  </div>
                  {pkg.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#999]">{pkg.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => install(pkg.name)}
                disabled={installing === pkg.name || installed.has(pkg.name) || sandboxStatus !== "ready"}
                className="flex shrink-0 items-center gap-1 rounded bg-[#2a2d2e] px-2 py-1 text-[11px] text-[#cccccc] hover:bg-[#333] disabled:opacity-50"
              >
                {installing === pkg.name ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : installed.has(pkg.name) ? (
                  <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {installed.has(pkg.name) ? "Installed" : "Install"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
