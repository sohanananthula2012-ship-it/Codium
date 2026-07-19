Here's the full architecture and UI specification as a structured document with ASCII art diagrams.

---

Daytona Code Editor — Technical Specification

Version: 1.0

Date: 2026-07-19

Author: Sohan Ananthula 

---

Table of Contents

1. System Architecture
2. Technology Stack
3. Data Flow Diagrams
4. UI Layout Specifications
5. Component Breakdown
6. Security Model
7. Deployment Architecture

---

1. System Architecture

1.1 Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Monaco    │  │   Xterm.js  │  │  HTML       │  │   Visualization     │ │
│  │   Editor    │  │  Terminal   │  │  Preview    │  │   Panel             │ │
│  │  (Code)     │  │  (Bash)     │  │  (Iframe)   │  │  (Canvas/SVG)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │              │
│         │ HTTP GET/POST  │ WebSocket      │ HTTP GET           │ HTTP GET     │
│         │ (files)        │ (keystrokes)   │ (proxy)            │ (assets)     │
└─────────┼────────────────┼────────────────┼────────────────────┼──────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATION SERVER (Node.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Session   │  │   Daytona   │  │  WebSocket  │  │   Port Forward      │ │
│  │   Manager   │  │   SDK       │  │   Proxy     │  │   (Preview)         │ │
│  │  (Redis)    │  │  Handler    │  │   Layer     │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │
│         │ JWT validate   │ gRPC/REST      │ WS proxy           │
│         │ rate limit     │ (SDK calls)    │ (PTY stream)       │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DAYTONA SANDBOX (microVM)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  10 GiB     │  │  Native     │  │   Linux     │  │   Port 3000         │ │
│  │  Disk (ext4)│  │  Toolchains │  │   PTY       │  │   (Preview Server)  │ │
│  │             │  │  (Node,Py)  │  │  (/dev/pts) │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                                               │
│  Git Repo → /workspace/project                                                │
│  User code → executes here, isolated from host                                │
│  Ephemeral → auto-wiped after session timeout                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

1.2 Why This Architecture

Layer	Responsibility	Why It Exists	
Client	Render UI, capture input, display output	Browser can't access filesystem or spawn processes	
Orchestration	Auth, session mgmt, rate limiting, API key protection	Daytona keys must never reach browser	
Sandbox	Actual code execution, file storage, terminal PTY	Hardware isolation via KVM microVM	

---

2. Technology Stack

2.1 Backend

Component	Technology	Purpose	
Runtime	Node.js 20 LTS	Server runtime	
Framework	Express 4.x	HTTP API	
WebSocket	`ws` library	Terminal proxy	
SDK	`@daytona/sdk`	Sandbox lifecycle	
Session Store	Redis (prod) / Map (dev)	Session persistence	
Auth	JWT + bcrypt	User authentication	
Validation	Zod	Request schema validation	

2.2 Frontend

Component	Technology	Purpose	
Editor	Monaco Editor 0.45	Code editing (same as VS Code)	
Terminal	xterm.js 5.3	Terminal emulation	
Build	Vite 5.x	Bundling and dev server	
Framework	Vanilla JS / React 18	UI logic	
Styling	CSS Variables	Theming	
Icons	Seti-UI (inline SVG)	File type icons	

2.3 Infrastructure

Component	Technology	Purpose	
Hosting	Fly.io / Railway	Orchestration server	
Sandboxes	Daytona Cloud	MicroVM provisioning	
CDN	Cloudflare	Static asset delivery	
DNS	Cloudflare	Domain management	

---

3. Data Flow Diagrams

3.1 Phase A: Open Project (Sandbox Creation)

```
┌─────────┐     POST /api/sandbox/create      ┌─────────────┐
│  User   │ ─────────────────────────────────> │  Backend    │
│         │  { userId, repoUrl, branch }       │             │
│         │                                    │             │
│         │     ┌─────────────────────┐        │             │
│         │     │ 1. Validate JWT     │        │             │
│         │     │ 2. Rate limit check │        │             │
│         │     │ 3. Call Daytona SDK │        │             │
│         │     └─────────────────────┘        │             │
│         │                                    │             │
│         │     ┌─────────────────────┐        │             │
│         │     │ Daytona.create()  │───────>│  Daytona    │
│         │     │  - 2 vCPU           │        │  Cloud      │
│         │     │  - 4 GB RAM         │        │             │
│         │     │  - 10 GB Disk       │        │             │
│         │     │  - autoStop: 24h    │        │             │
│         │     └─────────────────────┘        │             │
│         │                                    │             │
│         │     ┌─────────────────────┐        │             │
│         │     │ sandbox.process.    │        │             │
│         │     │  executeCommand()   │──────>│  Sandbox    │
│         │     │  `git clone ...`    │        │  microVM    │
│         │     └─────────────────────┘        │             │
│         │                                    │             │
│         │ <────────────────────────────────  │             │
│         │  { sandboxId, wsToken, fileTree }  │             │
│         │                                    └─────────────┘
│         │
│         │     WebSocket /ws/terminal?token=...
│         │ ─────────────────────────────────>
│         │  { type: "input", data: "ls\\n" }
│         │ <────────────────────────────────
│         │  { type: "data", data: "app.py\\n..." }
│         ▼
```

3.2 Phase B: Edit & Run

```
┌─────────┐     GET /api/files?path=src/main.py  ┌─────────────┐
│  User   │ ────────────────────────────────────> │  Backend    │
│         │                                      │             │
│         │     ┌─────────────────────┐          │             │
│         │     │ sandbox.fs.         │────────>│  Sandbox    │
│         │     │  readFile()         │         │             │
│         │     └─────────────────────┘          │             │
│         │                                      │             │
│         │ <──────────────────────────────────  │             │
│         │  { content: "import os..." }         │             │
│         │                                      └─────────────┘
│         │
│         │ [User edits in Monaco, presses Ctrl+S]
│         │
│         │     POST /api/files
│         │  { path: "src/main.py", content: "..." }
│         │ ────────────────────────────────────>
│         │
│         │ [User presses Ctrl+R to run]
│         │
│         │     POST /api/execute
│         │  { command: "python3 src/main.py" }
│         │ ────────────────────────────────────>
│         │     sandbox.process.executeCommand()
│         │     stdout/stderr streamed to terminal
│         ▼
```

3.3 Phase C: Cleanup

```
┌─────────┐     POST /api/sandbox/destroy      ┌─────────────┐
│  User   │ ─────────────────────────────────> │  Backend    │
│  closes │  { userId }                        │             │
│   tab   │                                    │             │
│         │     OR: Session timeout (24h)        │             │
│         │                                    │             │
│         │     ┌─────────────────────┐        │             │
│         │     │ Daytona.remove()    │─────>│  Daytona    │
│         │     │  sandbox.destroy()    │        │  Cloud      │
│         │     └─────────────────────┘        │             │
│         │                                    │             │
│         │     [Disk wiped, resources freed]    │             │
│         │                                    └─────────────┘
│         │
│         │     WebSocket closed
│         │     Session deleted from Redis
│         ▼
```

---

4. UI Layout Specifications

4.1 Main Editor Layout (Primary View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ○ ○ ○    File  Edit  Selection  View  Go  Run  Terminal  Help      ⊞ 🗔 ⋯  │
├────┬────────────────────────────────────────────────────────────────────────┤
│    │  EXPLORER                                    + 📁 ↻ ≡                  │
│    │  ▼ OPEN EDITORS                                                            │
│    │    🐍 app.py                    ●                                          │
│    │    🎨 styles.css                                                           │
│    │  ▼ PROJECT-ALPHA                                                          │
│    │    ▼ 📁 src                                                               │
│    │      🐍 main.py               ●                                          │
│    │      🐍 utils.py                                                           │
│    │      ▶ 📁 components                                                       │
│    │    ▶ 📁 tests                                                              │
│    │    📄 requirements.txt                                                     │
│    │    📝 README.md                                                            │
│    │    ⚙️ .gitignore                                                           │
│    │  ▼ DAYTONA                                                                 │
│    │    ● sb-7a3f2d9e                                                           │
│    │      2 CPU · 4 GB · 10 GB                                                  │
│    │    🌐 Port 3000 Preview                                                    │
│    │    📦 Packages                                                             │
│    │                                                                            │
│ 48 │                                                                            │
│ px │  ┌─────────────┐  ┌─────────────┐                                         │
│    │  │ 🐍 app.py ● │  │ 🎨 styles.css │  x                                     │
│    │  └─────────────┘  └─────────────┘                                         │
│    │  project-alpha › src › app.py                                              │
│    │                                                                            │
│    │  1  │ import os                                                            │
│    │  2  │ import numpy as np                                                   │
│    │  3  │ import matplotlib.pyplot as plt                                      │
│    │  4  │                                                                      │
│    │  5  │ def generate_chart(data):                                            │
│    │  6  │     """Generate visualization from sandbox data."""                  │
│    │  7  │     fig, ax = plt.subplots(figsize=(10, 6))                         │
│    │  8  │     ax.plot(data['x'], data['y'], linewidth=2, color='#007acc')     │
│    │  9  │     ax.set_title('Daytona Analytics', fontsize=14)                  │
│    │ 10  │     ax.grid(True, alpha=0.3)                                         │
│    │ 11  │     plt.savefig('/workspace/output/chart.png')                        │
│    │ 12  │     return fig                                                        │
│    │ 13  │                                                                      │
│    │ 14  │ if __name__ == '__main__':                                           │
│    │ 15  │     sample_data = {                                                  │
│    │ 16  │         'x': np.linspace(0, 10, 100),                                 │
│    │ 17  │         'y': np.sin(np.linspace(0, 10, 100))                         │
│    │ 18  │     }                                                                 │
│    │ 19  │     result = generate_chart(sample_data)                             │
│    │ 20  │     print(f"Chart saved. Sandbox ID: {os.getenv('DAYTONA_SANDBOX_ID')}")│
│    │     │                                                                      │
│    │     │                                                                      │
│    │     │                                                                      │
│    │     │                                                                      │
│    ├─────┴──────────────────────────────────────────────────────────────────────┤
│    │  ● bash    ○ Output    ○ Problems                                    🗑 + ▼ │
│    │  user@sb-7a3f2d9e:~$ pip install numpy matplotlib                          │
│    │  Collecting numpy                                                            │
│    │    Downloading numpy-2.0.0... (18.2 MB)                                      │
│    │       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 18.2/18.2 MB                │
│    │  Successfully installed numpy-2.0.0 matplotlib-3.9.0                        │
│    │  user@sb-7a3f2d9e:~$ █                                                       │
│    ├────────────────────────────────────────────────────────────────────────────┤
│    │  🌿 main*  ↻ 3 changes    ● Daytona: sb-7a3f2d9e  Python  UTF-8  Ln 14, Col 32 │
└────┴────────────────────────────────────────────────────────────────────────────┘
```

4.2 Git / Source Control View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ○ ○ ○    File  Edit  Selection  View  Go  Run  Terminal  Help      ⊞ 🗔 ⋯  │
├────┬────────────────────────────────────────────────────────────────────────┤
│    │  SOURCE CONTROL                                    + - ↓ ✓               │
│    │                                                                            │
│    │  ▼ CHANGES (3)                                                             │
│    │    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│    │    M  🐍 src/main.py              +12  -3    ━━━━●━━━━                    │
│    │    M  🐍 src/utils.py             +4   -1    ━━●━━━━━━━━                  │
│    │    A  🐍 src/components/card.py   +45  -0    ━━━━━━━━━━●                  │
│    │                                                                            │
│    │  ▼ STAGED CHANGES (0)                                                    │
│    │    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│    │    (no changes)                                                            │
│    │                                                                            │
│    │  ┌────────────────────────────────────────────────────────────────────┐   │
│    │  │ Message: feat: add card component with Daytona analytics...       │   │
│    │  └────────────────────────────────────────────────────────────────────┘   │
│    │                                            [✓ Commit]  [↩ Discard]          │
│    │                                                                            │
│ 48 │                                                                            │
│ px │  ┌────────────────────────┬────────────────────────┐                      │
│    │  │  src/main.py (HEAD)    │  src/main.py (Working) │                      │
│    │  │                        │                        │                      │
│    │  │  def old_func():       │  def old_func():       │                      │
│    │  │      pass              │      pass              │                      │
│    │  │                        │  + def new_helper():   │                      │
│    │  │                        │  +     return True     │                      │
│    │  │                        │                        │                      │
│    │  │  [green = unchanged]   │  [green = added]       │                      │
│    │  │  [red = removed]       │  [red = removed]       │                      │
│    │  └────────────────────────┴────────────────────────┘                      │
│    │                                                                            │
│    │                                                                            │
│    │                                                                            │
│    │                                                                            │
│    ├────────────────────────────────────────────────────────────────────────────┤
│    │  ● bash    ○ Output    ○ Problems                                    🗑 + ▼ │
│    │  user@sb-7a3f2d9e:~$ git status                                             │
│    │  M  src/main.py                                                              │
│    │  M  src/utils.py                                                             │
│    │  A  src/components/card.py                                                   │
│    │  user@sb-7a3f2d9e:~$ █                                                       │
│    ├────────────────────────────────────────────────────────────────────────────┤
│    │  🌿 main*  ↻ 3 changes    ● Daytona: sb-7a3f2d9e  Python  UTF-8  Ln 14, Col 32 │
└────┴────────────────────────────────────────────────────────────────────────────┘
```

4.3 Search View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ○ ○ ○    File  Edit  Selection  View  Go  Run  Terminal  Help      ⊞ 🗔 ⋯  │
├────┬────────────────────────────────────────────────────────────────────────┤
│    │  SEARCH                                                                    │
│    │  ┌────────────────────────────────────────────────────────────────────┐   │
│    │  │ 🔍 search across files...                                  [⚙]   │   │
│    │  │ Include: [*.py                    ] Exclude: [node_modules]      │   │
│    │  │                                                                    │   │
│    │  │ Results (12 matches in 3 files)                                    │   │
│    │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│    │  │                                                                    │   │
│    │  │  🐍 src/main.py                                                    │   │
│    │  │    > def generate_chart(data):                                      │   │
│    │  │      14:     return fig                                             │   │
│    │  │      15:     return result  ← 2 matches                             │   │
│    │  │                                                                    │   │
│    │  │  🐍 src/utils.py                                                     │   │
│    │  │    > def save_output(path):                                         │   │
│    │  │      8:  with open(path, 'w') as f:                                 │   │
│    │  │      9:      f.write(result)  ← 1 match                             │   │
│    │  │                                                                    │   │
│    │  │  🐍 src/components/card.py                                           │   │
│    │  │    > class Card:                                   
