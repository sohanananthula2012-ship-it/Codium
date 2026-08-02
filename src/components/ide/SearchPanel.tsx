import { useMemo, useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { GitHubAPI } from "@/lib/github";
import { Search as SearchIcon, File, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SearchPanel() {
  const { tree, openFile, token, repo } = useIdeState();
  const [query, setQuery] = useState("");
  const [codeResults, setCodeResults] = useState<{ path: string; url: string }[] | null>(null);
  const [searchingCode, setSearchingCode] = useState(false);

  const fileMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tree.filter(t => t.path.toLowerCase().includes(q)).slice(0, 50);
  }, [tree, query]);

  const searchInFiles = async () => {
    if (!query.trim() || !repo) return;
    setSearchingCode(true);
    setCodeResults(null);
    try {
      const gh = new GitHubAPI(token);
      const results = await gh.searchCode(repo.owner, repo.name, query.trim());
      setCodeResults(results);
    } catch (err: any) {
      toast.error(err.message || "Code search failed — GitHub's search API needs the repo to be indexed");
    } finally {
      setSearchingCode(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2 text-[11px] font-bold uppercase text-[#858585]">Search</div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-[#666]" />
          <input
            autoFocus
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setCodeResults(null);
            }}
            onKeyDown={e => e.key === "Enter" && searchInFiles()}
            placeholder="Search files by name..."
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#555]"
          />
        </div>
        {query.trim() && (
          <button
            onClick={searchInFiles}
            disabled={searchingCode}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded bg-[#2a2d2e] py-1 text-[11px] text-[#cccccc] hover:bg-[#333] disabled:opacity-50"
          >
            {searchingCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <SearchIcon className="h-3 w-3" />}
            Search inside file contents
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {codeResults !== null ? (
          <>
            <div className="px-3 py-1 text-[11px] text-[#666]">
              {codeResults.length} match{codeResults.length === 1 ? "" : "es"} in file contents
            </div>
            {codeResults.map(r => (
              <div
                key={r.path}
                onClick={() => openFile(r.path)}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#2a2d2e]"
              >
                <File className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
                <span className="truncate">{r.path}</span>
              </div>
            ))}
          </>
        ) : (
          query.trim() && (
            <>
              <div className="px-3 py-1 text-[11px] text-[#666]">
                {fileMatches.length} filename match{fileMatches.length === 1 ? "" : "es"}
              </div>
              {fileMatches.map(f => (
                <div
                  key={f.path}
                  onClick={() => openFile(f.path)}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] text-[#cccccc] hover:bg-[#2a2d2e]"
                >
                  <File className="h-3.5 w-3.5 shrink-0 text-[#858585]" />
                  <span className="truncate">{f.path}</span>
                </div>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}
