import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DAYTONA_API_KEY) {
    return res.status(500).json({ error: "DAYTONA_API_KEY is not configured on the server" });
  }

  const { sandboxId, repoDir, path, content, encoding } = req.body ?? {};
  if (!sandboxId || !repoDir || !path || content === undefined) {
    return res.status(400).json({ error: "sandboxId, repoDir, path, and content are required" });
  }

  try {
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    const sandbox = await daytona.get(sandboxId);
    const buf = encoding === "base64" ? Buffer.from(content, "base64") : Buffer.from(content, "utf8");
    await sandbox.fs.uploadFile(buf, `${repoDir}/${path}`);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to write file" });
  }
}
