import { useEffect, useMemo, useState } from "react";
import { GitHubAPI, type Repo, type GitHubUser } from "@/lib/github";
import { useIdeState } from "@/hooks/use-ide-state";
import { Github, ChevronDown, Search, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-amber-400",
  "from-blue-500 to-cyan-400",
  "from-pink-500 to-rose-400",
  "from-emerald-500 to-teal-400",
  "from-orange-500 to-red-400",
  "from-indigo-500 to-purple-400",
];

function gradientFor(id: number) {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = diffMs / 60000;
  if (min < 1) return "just now";
  if (min < 60) return `${Math.floor(min)}m ago`;
  const hr = min / 60;
  if (hr < 24) return `${Math.floor(hr)}h ago`;
  const days = hr / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RepoPicker() {
  const { token, setRepo } = useIdeState();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState<number | null>(null);

  useEffect(() => {
    const gh = new GitHubAPI(token);
    Promise.all([gh.listRepos(), gh.getUser()])
      .then(([repoList, userInfo]) => {
        setRepos(repoList);
        setUser(userInfo);
      })
      .catch(err => toast.error(err.message || "Failed to load repositories"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter(r => r.name.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q));
  }, [repos, query]);

  const select = (r: Repo) => {
    setImporting(r.id);
    setRepo({ owner: r.owner.login, name: r.name, branch: r.default_branch });
    toast.success(`Opened ${r.full_name}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-4 pt-16 pb-10">
      <div className="w-full max-w-2xl">
        <h1 className="mb-6 text-[28px] font-semibold tracking-tight text-white">
          Import Git Repository
        </h1>

        <div className="mb-5 flex gap-2.5">
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#111111] px-3.5 py-2.5 text-sm text-white">
            <Github className="h-4 w-4 text-[#a1a1a1]" />
            <span className="max-w-[160px] truncate">{user?.login ?? "..."}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#666]" />
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-[#2e2e2e] bg-[#111111] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#666] focus:border-[#555]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#222222] bg-[#0a0a0a]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#666]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#666]">
              No repositories found
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e1e]">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#131313]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-xs font-bold text-white/90",
                        gradientFor(r.id)
                      )}
                    >
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate text-[15px] font-medium text-white">{r.name}</span>
                      {r.private && <Lock className="h-3 w-3 shrink-0 text-[#666]" />}
                      <span className="shrink-0 text-[13px] text-[#666]">· {timeAgo(r.updated_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => select(r)}
                    disabled={importing === r.id}
                    className="ml-3 shrink-0 rounded-md bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-[#e2e2e2] disabled:opacity-60"
                  >
                    {importing === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Import"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
