import { useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { KeyRound } from "lucide-react";

export function LoginScreen() {
  const [input, setInput] = useState("");
  const { setToken } = useIdeState();

  const submit = () => {
    if (!input.startsWith("ghp_") && !input.startsWith("github_pat_")) {
      alert("Enter a valid GitHub Personal Access Token");
      return;
    }
    localStorage.setItem("gh_token", input);
    setToken(input);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#1e1e1e]">
      <div className="mb-6 text-6xl font-bold text-[#007acc]">C</div>
      <h1 className="mb-2 text-2xl font-bold text-white">Codium</h1>
      <p className="mb-8 text-sm text-[#858585]">Cloud IDE powered by GitHub</p>
      <div className="w-80 space-y-3">
        <div className="flex items-center gap-2 rounded bg-[#252526] px-3 py-2 border border-[#3c3c3c]">
          <KeyRound className="h-4 w-4 text-[#858585]" />
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#858585]"
          />
        </div>
        <button
          onClick={submit}
          className="w-full rounded bg-[#007acc] py-2 text-sm font-medium text-white hover:bg-[#0066aa]"
        >
          Connect
        </button>
        <p className="text-center text-[11px] text-[#858585]">
          Get token at <a href="https://github.com/settings/tokens" target="_blank" className="text-[#007acc] underline">github.com/settings/tokens</a>
          <br />Scope: <code className="text-[#cccccc]">repo</code>
        </p>
      </div>
    </div>
  );
}
