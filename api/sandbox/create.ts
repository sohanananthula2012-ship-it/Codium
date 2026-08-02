import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";
import { TERM_SERVER_SOURCE } from "../../daytona/termServerSource";

const TERM_PORT = 4001;

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

  try {
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    const sandbox = await daytona.create({ language: "typescript" });
    const workdir = await sandbox.getWorkDir();

    const cloneUrl = githubToken
      ? `https://${githubToken}@github.com/${owner}/${name}.git`
      : `https://github.com/${owner}/${name}.git`;

    await sandbox.process.executeCommand(
      `git clone --branch ${branch} --single-branch ${cloneUrl} repo`,
      workdir,
      undefined,
      60
    );

    const repoDir = `${workdir}/repo`;

    await sandbox.fs.uploadFile(Buffer.from(TERM_SERVER_SOURCE, "utf8"), `${workdir}/termserver.js`);
    await sandbox.process.executeCommand("npm install ws --no-audit --no-fund", workdir, undefined, 90);

    const sessionId = "terminal";
    await sandbox.process.createSession(sessionId);
    await sandbox.process.executeSessionCommand(sessionId, {
      command: `cd ${repoDir} && PORT=${TERM_PORT} node ${workdir}/termserver.js`,
      runAsync: true,
    });

    const preview = await sandbox.getSignedPreviewUrl(TERM_PORT, 3600);
    const wsUrl = preview.url.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");

    return res.status(200).json({ sandboxId: sandbox.id, wsUrl, repoDir });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to create sandbox" });
  }
}
