import { useEffect, useState } from "react";
import { GitHubAPI, type Repo } from "@/lib/github";
import { useIdeState } from "@/hooks/use-ide-state";
import { GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RepoPicker() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, setRepo } = useIdeState();

  useEffect(() => {
    const gh = new GitHubAPI(token);
    gh.listRepos()
      .then(setRepos)
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const select = (r: Repo) => {
    setRepo({ owner: r.owner.login, name: r.name, branch: r.default_branch });
    toast.success(`Opened ${r.full_name}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#007acc]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#1e1e1e]">
      <h1 className="mb-8 text-2xl font-bold text-white">Select Repository</h1>
      <div className="w-full max-w-md space-y-1 px-4">
        {repos.map(r => (
          <button
            key={r.id}
            onClick={() => select(r)}
            className="flex w-full items-center gap-3 rounded bg-[#252526] px-4 py-3 text-left hover:bg-[#3c3c3c] transition-colors"
          >
            <GitBranch className="h-5 w-5 shrink-0 text-[#007acc]" />
            <div className="min-w-0">
              <div className="truncate font-medium text-white">{r.name}</div>
              <div className="truncate text-sm text-[#858585]">{r.full_name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
