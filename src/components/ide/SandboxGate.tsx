import { useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";

export function SandboxGate() {
  const { repo, unlockSandbox } = useIdeState();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!input || loading) return;
    setLoading(true);
    setError("");
    try {
      const ok = await unlockSandbox(input);
      if (!ok) setError("That's not it.");
    } catch {
      setError("Couldn't verify passphrase. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-6">
      <div className="w-full max-w-[340px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#007acc] text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-white">Unlock your sandbox</h1>
          <p className="mt-1 text-[13px] text-[#777]">
            {repo ? `${repo.owner}/${repo.name}` : "This repo"} gets one persistent Daytona sandbox.
            Enter the passphrase to create it (first time) or reconnect to it (every time after).
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#151515] px-3 py-2.5 focus-within:border-[#007acc]">
          <KeyRound className="h-4 w-4 shrink-0 text-[#666]" />
          <input
            autoFocus
            type="password"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setError("");
            }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Passphrase"
            disabled={loading}
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#555] disabled:opacity-60"
          />
        </div>
        {error && <p className="mt-1.5 text-[12px] text-[#f14c4c]">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !input}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#007acc] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0066aa] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              Unlock
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
