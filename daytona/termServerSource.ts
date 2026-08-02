// This string is uploaded into the Daytona sandbox and run there with plain
// Node.js. It deliberately avoids any native modules (no node-pty) — `ws` is
// pure JS, and `script(1)` gives us a real pseudo-tty without needing to
// compile anything inside the sandbox. That trade-off costs us true terminal
// resizing, but buys total reliability across sandbox images.
//
// It also polls /proc/net/tcp(6) for newly-opened listening ports and pushes
// a `{type:'port', port}` message to the browser when it sees one it hasn't
// reported before. That's what lets the UI offer a public preview link for
// anything a CLI tool starts inside the sandbox — including a localhost
// OAuth callback server a CLI might spin up during `login`.
export const TERM_SERVER_SOURCE = `
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
