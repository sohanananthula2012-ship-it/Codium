import { useState } from "react";
import { useIdeState } from "@/hooks/use-ide-state";
import { KeyRound, ArrowRight, GitBranch, FolderTree, ShieldCheck } from "lucide-react";

const SNIPPET = [
  { n: 1, t: [["import ", "kw"], ["{ IdeProvider }", "id"], [" from ", "kw"], ['"@/hooks/use-ide-state"', "str"], [";", "pl"]] },
  { n: 2, t: [["import ", "kw"], ["Ide", "id"], [" from ", "kw"], ['"@/pages/ide"', "str"], [";", "pl"]] },
  { n: 3, t: [] },
  { n: 4, t: [["export default function ", "kw"], ["App", "fn"], ["() {", "pl"]] },
  { n: 5, t: [["  return ", "kw"], ["<IdeProvider>", "tag"]] },
  { n: 6, t: [["    <Ide />", "tag"]] },
  { n: 7, t: [["  </IdeProvider>", "tag"]] },
  { n: 8, t: [["}", "pl"]] },
];

const TOKEN_COLORS: Record<string, string> = {
  kw: "text-[#c586c0]",
  id: "text-[#4ec9b0]",
  fn: "text-[#dcdcaa]",
  str: "text-[#ce9178]",
  tag: "text-[#569cd6]",
  pl: "text-[#cccccc]",
};

export function LoginScreen() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const { setToken } = useIdeState();

  const submit = () => {
    if (!input.startsWith("ghp_") && !input.startsWith("github_pat_")) {
      setError("That doesn't look like a valid GitHub token.");
      return;
    }
    setError("");
    localStorage.setItem("gh_token", input);
    setToken(input);
  };

  return (
    <div className="flex min-h-screen bg-[#0d0d0d]">
      {/* Left: product preview, hidden on small screens */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-[#1f1f1f] bg-[#0a0a0a] lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#007acc] opacity-[0.12] blur-[100px]" />

        <div className="relative w-[420px] overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#141414] shadow-2xl">
          <div className="flex h-8 items-center gap-2 border-b border-[#2a2a2a] bg-[#1a1a1a] px-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2 text-[11px] text-[#666]">App.tsx</span>
          </div>
          <div className="flex">
            <div className="w-32 shrink-0 border-r border-[#2a2a2a] py-2">
              {["src", "  hooks", "  pages", "  components", "  App.tsx"].map((f, i) => (
                <div key={i} className="px-3 py-1 text-[11px] text-[#777]">
                  {f}
                </div>
              ))}
            </div>
            <div className="flex-1 px-4 py-3 font-mono text-[12.5px] leading-[1.9]">
              {SNIPPET.map(line => (
                <div key={line.n} className="flex gap-4">
                  <span className="w-4 shrink-0 select-none text-right text-[#4a4a4a]">{line.n}</span>
                  <span className="whitespace-pre">
                    {line.t.map(([text, cls], i) => (
                      <span key={i} className={TOKEN_COLORS[cls]}>
                        {text}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: welcome + token entry */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-[480px] lg:shrink-0">
        <div className="w-full max-w-[340px]">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#007acc] text-xl font-bold text-white">
              C
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Codium</h1>
              <p className="text-[13px] text-[#777]">Cloud IDE, powered by GitHub</p>
            </div>
          </div>

          <div className="mb-6 space-y-2.5">
            {[
              { icon: FolderTree, text: "Browse and edit any repo you have access to" },
              { icon: GitBranch, text: "Push commits straight from the editor" },
              { icon: ShieldCheck, text: "Your token stays in this browser, nowhere else" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13px] text-[#a1a1a1]">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#007acc]" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <label className="mb-1.5 block text-[12px] font-medium text-[#a1a1a1]">
            Personal Access Token
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#151515] px-3 py-2.5 focus-within:border-[#007acc]">
            <KeyRound className="h-4 w-4 shrink-0 text-[#666]" />
            <input
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#555]"
            />
          </div>
          {error && <p className="mt-1.5 text-[12px] text-[#f14c4c]">{error}</p>}

          <button
            onClick={submit}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#007acc] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0066aa]"
          >
            Connect
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-center text-[12px] text-[#666]">
            Need a token? Create one at{" "}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noreferrer"
              className="text-[#007acc] hover:underline"
            >
              github.com/settings/tokens
            </a>
            <br />
            with the <code className="rounded bg-[#1f1f1f] px-1 py-0.5 text-[#cccccc]">repo</code> scope enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
