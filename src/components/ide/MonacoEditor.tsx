import Editor, { type OnMount } from "@monaco-editor/react";
import { useIdeState } from "@/hooks/use-ide-state";

const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  md: "markdown",
  css: "css",
  html: "html",
  py: "python",
  yml: "yaml",
  yaml: "yaml",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  sh: "shell",
};

function languageFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "plaintext";
}

export function MonacoEditor() {
  const { openTabs, activePath, updateTabContent, saveFile, setCursorPosition } = useIdeState();
  const activeTab = openTabs.find(t => t.path === activePath);

  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const path = editor.getModel()?.uri.path.replace(/^\//, "");
      if (path) saveFile(path);
    });
    editor.onDidChangeCursorPosition(e => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });
  };

  if (!activeTab) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#858585]">
        Select a file to start editing
      </div>
    );
  }

  return (
    <Editor
      key={activeTab.path}
      path={activeTab.path}
      language={languageFor(activeTab.path)}
      value={activeTab.content}
      theme="vs-dark"
      onMount={handleMount}
      onChange={value => updateTabContent(activeTab.path, value ?? "")}
      options={{
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
      }}
    />
  );
}
