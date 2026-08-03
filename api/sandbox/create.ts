import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";

const TERM_PORT = 4001;

// Uploaded into the sandbox and run there with plain Node.js. No native
// modules (no node-pty) — `ws` is pure JS, and `script(1)` gives us a real
// pseudo-tty without compiling anything inside the sandbox. It also polls
// /proc/net/tcp(6) for newly-opened listening ports and reports them back
// over the socket, which is what lets the UI offer a public preview link
// for anything a CLI tool starts inside the sandbox.
//
// This lives inline (rather than imported from a separate file) because a
// cross-directory relative import was the likely cause of a "module not
// found" error in Vercel's function bundler.
const TERM_SERVER_SOURCE = `
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');

const PORT = Number(process.env.PORT || 4001);
const wss = new WebSocketServer({ port: PORT });
const clients = new Set();

function parseListeningPorts(procFile) {
  const ports = new Set();
  try {
    const data = fs.readFileSync(procFile, 'utf8');
    const lines = data.trim().split('\\n').slice(1);
    for (const line of lines) {
      const parts = line.trim().split(/\\s+/);
      const localAddr = parts[1];
      const state = parts[3];
      if (state === '0A' && localAddr) {
        const portHex = localAddr.split(':')[1];
        if (portHex) ports.add(parseInt(portHex, 16));
      }
    }
  } catch (e) {
    /* proc file may not exist on every kernel; ignore */
  }
  return ports;
}

const seenPorts = new Set([PORT]);

setInterval(() => {
  const current = new Set([
    ...parseListeningPorts('/proc/net/tcp'),
    ...parseListeningPorts('/proc/net/tcp6'),
  ]);
  for (const port of current) {
    if (!seenPorts.has(port)) {
      seenPorts.add(port);
      const msg = JSON.stringify({ type: 'port', port });
      for (const ws of clients) {
        if (ws.readyState === ws.OPEN) ws.send(msg);
      }
    }
  }
}, 3000);

wss.on('connection', (ws) => {
  clients.add(ws);

  const shell = spawn('script', ['-qfc', 'bash', '/dev/null'], {
    env: Object.assign({}, process.env, { TERM: 'xterm-256color' }),
  });

  const send = (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'data', data }));
    }
  };

  shell.stdout.on('data', (chunk) => send(chunk.toString('utf8')));
  shell.stderr.on('data', (chunk) => send(chunk.toString('utf8')));
  shell.on('exit', () => ws.close());

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      return;
    }
    if (msg.type === 'input' && shell.stdin.writable) {
      shell.stdin.write(msg.data);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    try { shell.kill(); } catch (e) {}
  });
});

console.log('Terminal server listening on port ' + PORT);
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DAYTONA_API_KEY) {
    return res.status(500).json({ error: "DAYTONA_API_KEY is not configured on the server" });
  }

  const { owner, name, branch, githubToken } = req.body ?? {};
  if (!owner || !name || !branch) {
    return res.status(400).json({ error: "owner, name, and branch are required" });
  }

  const universalId = process.env.DAYTONA_SANDBOX_ID;

  try {
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    let sandbox: Awaited<ReturnType<typeof daytona.create>>;
    let isFresh = false;

    if (universalId) {
      sandbox = await step("attach to universal sandbox", () => daytona.get(universalId));
      await step("start universal sandbox", () => sandbox.start(60));
    } else {
      sandbox = await step("create sandbox", () => daytona.create({ language: "typescript" }));
      isFresh = true;
    }

    const workdir = await step("read sandbox workdir", () => sandbox.getWorkDir());

    // In universal mode, multiple repos share one sandbox, each in its own
    // folder. Otherwise it's the old single-repo-per-sandbox layout.
    const repoDir = universalId ? `${workdir}/repos/${owner}-${name}` : `${workdir}/repo`;

    const cloneUrl = githubToken
      ? `https://${githubToken}@github.com/${owner}/${name}.git`
      : `https://github.com/${owner}/${name}.git`;

    const alreadyCloned = universalId
      ? await step("check existing clone", async () => {
          const check = await sandbox.process.executeCommand(
            `test -d "${repoDir}/.git" && echo yes || echo no`,
            workdir,
            undefined,
            10
          );
          return check.result?.trim() === "yes";
        })
      : false;

    await Promise.all([
      alreadyCloned
        ? Promise.resolve()
        : step("git clone", () =>
            sandbox.process.executeCommand(
              `mkdir -p "$(dirname "${repoDir}")" && git clone --branch ${branch} --single-branch ${cloneUrl} "${repoDir}"`,
              workdir,
              undefined,
              35
            )
          ),
      step("set up terminal server + toolchain", async () => {
        await sandbox.fs.uploadFile(Buffer.from(TERM_SERVER_SOURCE, "utf8"), `${workdir}/termserver.js`);
        await sandbox.process.executeCommand("npm install ws --no-audit --no-fund", workdir, undefined, 35);
        // Idempotent: only touches things that are actually missing.
        await sandbox.process.executeCommand(SETUP_SCRIPT, workdir, undefined, 45).catch(() => {
          // best-effort — don't fail the whole request if e.g. apt isn't available
        });
      }),
    ]);

    const sessionId = "terminal";
    if (isFresh || universalId) {
      await step("start terminal session", () => sandbox.process.createSession(sessionId)).catch(() => {
        // session may already exist in a shared sandbox
      });
      await step("launch terminal server", () =>
        sandbox.process.executeSessionCommand(sessionId, {
          command: `cd ${workdir} && PORT=${TERM_PORT} node ${workdir}/termserver.js`,
          runAsync: true,
        })
      ).catch(() => {
        // already running is fine
      });
    }

    const preview = await step("create preview link", () => sandbox.getSignedPreviewUrl(TERM_PORT, 3600));
    const wsUrl = preview.url.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");

    return res.status(200).json({ sandboxId: sandbox.id, wsUrl, repoDir, isUniversal: !!universalId });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to create sandbox" });
  }
}

// Runs once per sandbox setup. Guards every step so re-running it (e.g. on
// every attach) is cheap once everything's already installed.
const SETUP_SCRIPT = `
set -e
# node_modules/.bin on PATH so locally-installed CLIs work without npx
grep -qF 'node_modules/.bin' ~/.bashrc 2>/dev/null || echo 'export PATH="$PWD/node_modules/.bin:$HOME/.bun/bin:$PATH"' >> ~/.bashrc

command -v python3 >/dev/null 2>&1 || (sudo apt-get update -y && sudo apt-get install -y python3 python3-pip) || true
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash || true
`;

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    throw new Error(`${label} failed: ${err?.message || err}`);
  }
}
