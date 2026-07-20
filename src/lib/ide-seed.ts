export type FileKind = "file" | "folder";

export interface FileNode {
  id: string;
  name: string;
  kind: FileKind;
  path: string;
  children?: FileNode[];
  language?: string;
  /** When the file is "dirty" (edited but not saved). */
  dirty?: boolean;
}

export interface SandboxInfo {
  id: string;
  cpu: number;
  ram: string;
  disk: string;
  status: "active" | "stopped" | "starting";
  region: string;
  uptime: string;
}

export interface SourceChange {
  id: string;
  path: string;
  status: "M" | "A" | "D";
  added: number;
  removed: number;
  fill: number; // 0..1, for the diff bar
}

export interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  description?: string;
  icon?: string;
}

export interface SearchResult {
  id: string;
  file: string;
  language: string;
  matches: { line: number; text: string }[];
}

// ---------------------------------------------------------------------------
// File tree — matches ARCHITECTURE.md §4.1 ascii mockup
// ---------------------------------------------------------------------------

export const fileTree: FileNode = {
  id: "root",
  name: "project-alpha",
  kind: "folder",
  path: "/project-alpha",
  children: [
    {
      id: "src",
      name: "src",
      kind: "folder",
      path: "/project-alpha/src",
      children: [
        {
          id: "src/app.py",
          name: "app.py",
          kind: "file",
          path: "/project-alpha/src/app.py",
          language: "python",
          dirty: true,
        },
        {
          id: "src/utils.py",
          name: "utils.py",
          kind: "file",
          path: "/project-alpha/src/utils.py",
          language: "python",
        },
        {
          id: "src/components",
          name: "components",
          kind: "folder",
          path: "/project-alpha/src/components",
          children: [
            {
              id: "src/components/button.py",
              name: "button.py",
              kind: "file",
              path: "/project-alpha/src/components/button.py",
              language: "python",
            },
            {
              id: "src/components/card.py",
              name: "card.py",
              kind: "file",
              path: "/project-alpha/src/components/card.py",
              language: "python",
            },
          ],
        },
      ],
    },
    {
      id: "tests",
      name: "tests",
      kind: "folder",
      path: "/project-alpha/tests",
      children: [
        {
          id: "tests/test_main.py",
          name: "test_main.py",
          kind: "file",
          path: "/project-alpha/tests/test_main.py",
          language: "python",
        },
      ],
    },
    {
      id: "requirements.txt",
      name: "requirements.txt",
      kind: "file",
      path: "/project-alpha/requirements.txt",
      language: "plaintext",
    },
    {
      id: "README.md",
      name: "README.md",
      kind: "file",
      path: "/project-alpha/README.md",
      language: "markdown",
    },
    {
      id: ".gitignore",
      name: ".gitignore",
      kind: "file",
      path: "/project-alpha/.gitignore",
      language: "plaintext",
    },
  ],
};

// ---------------------------------------------------------------------------
// File contents — taken from ARCHITECTURE.md §4.1 and crafted for the rest
// ---------------------------------------------------------------------------

export const fileContents: Record<string, string> = {
  "src/app.py": `import os
import numpy as np
import matplotlib.pyplot as plt

def generate_chart(data):
    """Generate visualization from sandbox data."""
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(data['x'], data['y'], linewidth=2, color='#007acc')
    ax.set_title('Daytona Analytics', fontsize=14)
    ax.grid(True, alpha=0.3)
    plt.savefig('/workspace/output/chart.png')
    return fig

if __name__ == '__main__':
    sample_data = {
        'x': np.linspace(0, 10, 100),
        'y': np.sin(np.linspace(0, 10, 100))
    }
    result = generate_chart(sample_data)
    print(f"Chart saved. Sandbox ID: {os.getenv('DAYTONA_SANDBOX_ID')}")
`,
  "src/utils.py": `"""Utility helpers shared across the project."""

import json
from pathlib import Path

WORKSPACE = Path('/workspace')


def load_config(name: str) -> dict:
    """Load a JSON config from the project root."""
    with (WORKSPACE / 'project-alpha' / f'{name}.json').open() as f:
        return json.load(f)


def save_output(path: str, result) -> None:
    target = WORKSPACE / path
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open('w') as f:
        f.write(result)
`,
  "src/components/button.py": `class Button:
    """Reusable button component."""

    def __init__(self, label: str, on_click=None):
        self.label = label
        self.on_click = on_click

    def render(self) -> str:
        return f'<button onclick="{self.on_click}">{self.label}</button>'
`,
  "src/components/card.py": `from .button import Button


class Card:
    def __init__(self, title: str, body: str):
        self.title = title
        self.body = body
        self.cta = Button('Learn more', on_click='on_card_click()')

    def render(self) -> str:
        return f'<section><h3>{self.title}</h3><p>{self.body}</p>{self.cta.render()}</section>'
`,
  "tests/test_main.py": `from src.app import generate_chart


def test_generate_chart_returns_figure():
    data = {"x": [0, 1, 2], "y": [0, 1, 0]}
    fig = generate_chart(data)
    assert fig is not None
`,
  "requirements.txt": `numpy==2.0.0
matplotlib==3.9.0
pytest==8.2.0
`,
  "README.md": `# project-alpha

Daytona-sandbox demo project.

## Run

\`\`\`
python3 src/app.py
\`\`\`

The script writes a chart to \`/workspace/output/chart.png\`.
`,
  ".gitignore": `__pycache__/
*.pyc
.venv/
output/
`,
};

// ---------------------------------------------------------------------------
// Sandbox card data
// ---------------------------------------------------------------------------

export const sandbox: SandboxInfo = {
  id: "sb-7a3f2d9e",
  cpu: 2,
  ram: "4 GB",
  disk: "10 GB",
  status: "active",
  region: "us-east-1",
  uptime: "00:42:11",
};

// ---------------------------------------------------------------------------
// Source control changes
// ---------------------------------------------------------------------------

export const sourceChanges: SourceChange[] = [
  { id: "1", path: "src/app.py", status: "M", added: 12, removed: 3, fill: 0.62 },
  { id: "2", path: "src/utils.py", status: "M", added: 4, removed: 1, fill: 0.28 },
  { id: "3", path: "src/components/card.py", status: "A", added: 45, removed: 0, fill: 0.95 },
];

// ---------------------------------------------------------------------------
// Search results (mocked against the seed files)
// ---------------------------------------------------------------------------

export const searchResults: SearchResult[] = [
  {
    id: "1",
    file: "src/app.py",
    language: "python",
    matches: [
      { line: 5, text: "def generate_chart(data):" },
      { line: 14, text: "    return fig" },
      { line: 15, text: "    return result  <- 2 matches" },
    ],
  },
  {
    id: "2",
    file: "src/utils.py",
    language: "python",
    matches: [
      { line: 8, text: "    with open(path, 'w') as f:" },
      { line: 9, text: "        f.write(result)  <- 1 match" },
    ],
  },
  {
    id: "3",
    file: "src/components/card.py",
    language: "python",
    matches: [{ line: 1, text: "class Card:" }],
  },
];

// ---------------------------------------------------------------------------
// Command palette
// ---------------------------------------------------------------------------

export const commands: PaletteCommand[] = [
  {
    id: "open",
    label: "Open Project / Clone Repository",
    shortcut: "Ctrl+O",
    description: "Open a project from a local folder or git URL.",
  },
  {
    id: "sandbox",
    label: "Create Daytona Sandbox",
    shortcut: "Ctrl+Shift+S",
    description: "Provision a fresh microVM sandbox.",
  },
  {
    id: "run",
    label: "Run Current File",
    shortcut: "Ctrl+R",
    description: "Execute the active file in the sandbox terminal.",
  },
  {
    id: "install",
    label: "Install Python Packages",
    shortcut: "Ctrl+Shift+P",
    description: "Install the project requirements.",
  },
  {
    id: "preview",
    label: "Open Port Preview",
    shortcut: "Ctrl+Shift+V",
    description: "Open the sandbox's running web server.",
  },
  {
    id: "viz",
    label: "Show Visualization Panel",
    shortcut: "Ctrl+Shift+G",
    description: "Open the matplotlib / plotly visualization panel.",
  },
  {
    id: "theme",
    label: "Toggle Theme",
    shortcut: "Ctrl+K Ctrl+T",
    description: "Switch between dark and light themes.",
  },
  {
    id: "settings",
    label: "Open Settings",
    shortcut: "Ctrl+,",
    description: "Open the editor settings.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getLanguageFromPath(path: string): string {
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  return "plaintext";
}

export function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function getBreadcrumbs(path: string): string[] {
  return path.split("/").filter(Boolean);
}
