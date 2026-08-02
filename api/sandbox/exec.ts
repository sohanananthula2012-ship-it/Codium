import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DAYTONA_API_KEY) {
    return res.status(500).json({ error: "DAYTONA_API_KEY is not configured on the server" });
  }

  const { sandboxId, command, cwd } = req.body ?? {};
  if (!sandboxId || !command) {
    return res.status(400).json({ error: "sandboxId and command are required" });
  }

  try {
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    const sandbox = await daytona.get(sandboxId);
    const result = await sandbox.process.executeCommand(command, cwd, undefined, 30);
    return res.status(200).json({ exitCode: result.exitCode, output: result.result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to execute command" });
  }
}
