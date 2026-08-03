import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";

const TERM_PORT = 4001;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DAYTONA_API_KEY) {
    return res.status(500).json({ error: "DAYTONA_API_KEY is not configured on the server" });
  }

  const { sandboxId, repoDir } = req.body ?? {};
  if (!sandboxId || !repoDir) {
    return res.status(400).json({ error: "sandboxId and repoDir are required" });
  }

  try {
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    const sandbox = await daytona.get(sandboxId);

    // The sandbox may have been auto-stopped/paused between sessions —
    // start() is safe to call even if it's already running.
    await sandbox.start(60);

    const workdir = await sandbox.getWorkDir();

    // The terminal server process itself doesn't survive a stop/start cycle
    // (only the filesystem does), so relaunch it every time we attach.
    const sessionId = "terminal";
    try {
      await sandbox.process.createSession(sessionId);
    } catch {
      // session may already exist from a previous attach in this sandbox's lifetime
    }
    await sandbox.process
      .executeSessionCommand(sessionId, {
        command: `cd ${repoDir} && PORT=${TERM_PORT} node ${workdir}/termserver.js`,
        runAsync: true,
      })
      .catch(() => {
        // already running is fine
      });

    const preview = await sandbox.getSignedPreviewUrl(TERM_PORT, 3600);
    const wsUrl = preview.url.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");

    return res.status(200).json({ sandboxId: sandbox.id, wsUrl, repoDir });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to reconnect to sandbox" });
  }
}
